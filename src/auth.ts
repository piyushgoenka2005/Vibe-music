import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db/prisma";
import { createAuthPrismaAdapter } from "@/lib/auth/prisma-adapter";
import { verifyPassword } from "@/lib/auth/password";
import { resolveSessionMaxAgeSeconds } from "@/lib/auth/session-config";
import {
  ensureOAuthUserProfile,
  findUserByEmail,
} from "@/lib/server/userService";
import { isGoogleAuthConfigured, getGoogleAuthCredentials } from "@/lib/auth/google-config";
import { linkGuestOrdersToUser } from "@/lib/server/orderService";
import { logAuditEvent } from "@/lib/server/auditLog";
import { loginSchema } from "@/lib/validations/auth";
import { getAdminSession } from "@/lib/server/adminService";
import type { AdminRole } from "@/types/admin";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image?: string | null;
      emailVerified?: Date | null;
      isAdmin: boolean;
      adminRole?: AdminRole;
    };
  }

  interface User {
    rememberMe?: boolean;
  }
}

function buildProviders(): NextAuthConfig["providers"] {
  const providers: NextAuthConfig["providers"] = [
    Credentials({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password,
        });
        if (!parsed.success) {
          return null;
        }

        const rememberMe = credentials?.remember === "true";
        const user = await findUserByEmail(parsed.data.email);
        if (!user || !user.isActive) {
          return null;
        }

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          rememberMe,
        };
      },
    }),
  ];

  if (isGoogleAuthConfigured()) {
    const google = getGoogleAuthCredentials();
    if (google) {
      providers.unshift(
        Google({
          clientId: google.clientId,
          clientSecret: google.clientSecret,
          // Allows Google sign-in when the shopper already registered with the same email.
          // Prefer keeping email verification strict; do not remove without a linking UX.
          allowDangerousEmailAccountLinking: true,
        })
      );
    }
  }

  return providers;
}

function resolveAuthSecret(): string | undefined {
  const fromEnv =
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (fromEnv) return fromEnv;
  // Local/dev only — Auth.js throws Configuration without a secret.
  if (process.env.NODE_ENV !== "production") {
    return "dev-only-auth-secret-not-for-production";
  }
  return undefined;
}

export const authConfig = {
  trustHost: true,
  secret: resolveAuthSecret(),
  adapter: createAuthPrismaAdapter(prisma),
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: buildProviders(),
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "google" && user.email) {
          // Resolve/create profile without throwing on existing emails — a throw
          // here becomes Auth.js AccessDenied and blocks login entirely.
          if (user.id) {
            const resolved = await ensureOAuthUserProfile({
              id: user.id,
              email: user.email,
              name: user.name ?? profile?.name,
              image: user.image,
            });
            // Keep JWT/session on the canonical storefront user id when OAuth
            // arrived with a mismatched temporary id.
            if (resolved.id !== user.id) {
              user.id = resolved.id;
            }
          }

          if (user.id && user.email) {
            void linkGuestOrdersToUser(user.id, user.email).catch(() => undefined);
          }

          return true;
        }

        if (user.id && user.email) {
          void linkGuestOrdersToUser(user.id, user.email).catch(() => undefined);
        }

        return true;
      } catch (error) {
        console.error("[auth] signIn callback failed", error);
        // Prefer completing OAuth over blocking shoppers when profile sync fails.
        return true;
      }
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.uid = user.id;
        const rememberMe = user.rememberMe ?? false;
        const maxAge = resolveSessionMaxAgeSeconds(rememberMe);
        token.exp = Math.floor(Date.now() / 1000) + maxAge;
      }

      if (trigger === "update" && session?.user?.name) {
        token.name = session.user.name;
      }

      const uid = typeof token.uid === "string" ? token.uid : token.sub;
      if (uid) {
        const adminSession = await getAdminSession(uid);
        token.isAdmin = Boolean(adminSession);
        token.adminRole = adminSession?.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (!token?.uid && !token?.sub) {
        return session;
      }

      const id = String(token.uid ?? token.sub);
      const adminRole =
        typeof token.adminRole === "string" ? (token.adminRole as AdminRole) : undefined;

      session.user = {
        id,
        email: session.user?.email ?? "",
        name: session.user?.name ?? (typeof token.name === "string" ? token.name : null),
        image: session.user?.image ?? null,
        emailVerified: session.user?.emailVerified ?? null,
        isAdmin: Boolean(token.isAdmin),
        adminRole,
      };

      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (!user.id) return;

      void logAuditEvent({
        action: "auth.session_created",
        actorId: user.id,
        actorEmail: user.email ?? undefined,
        resourceType: "session",
        metadata: { provider: account?.provider ?? "credentials" },
      });
    },
    async signOut(message) {
      const token = "token" in message ? message.token : null;
      const userId =
        token && typeof token.uid === "string"
          ? token.uid
          : token && typeof token.sub === "string"
            ? token.sub
            : null;
      if (!userId) return;

      void logAuditEvent({
        action: "auth.session_deleted",
        actorId: userId,
        resourceType: "session",
      });
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
