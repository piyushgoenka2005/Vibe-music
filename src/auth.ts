import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { resolveSessionMaxAgeSeconds } from "@/lib/auth/session-config";
import {
  ensureOAuthUserProfile,
  findUserByEmail,
} from "@/lib/server/userService";
import { isGoogleAuthConfigured } from "@/lib/auth/google-config";
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

const googleProvider = isGoogleAuthConfigured()
  ? Google({
      clientId: (process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID)!,
      clientSecret: (process.env.AUTH_GOOGLE_SECRET ??
        process.env.GOOGLE_CLIENT_SECRET)!,
      allowDangerousEmailAccountLinking: false,
    })
  : null;

export const authConfig = {
  trustHost: true,
  // Prefer AUTH_SECRET; fall back to NEXTAUTH_SECRET for Auth.js v4 aliases.
  secret:
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    undefined,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(googleProvider ? [googleProvider] : []),
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
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email && user.id) {
        const existing = await findUserByEmail(user.email);
        if (existing && existing.id !== user.id) {
          return "/login?error=OAuthAccountNotLinked";
        }

        await ensureOAuthUserProfile({
          id: user.id,
          email: user.email,
          name: user.name ?? profile?.name,
          image: user.image,
        });
      }

      if (user.id && user.email) {
        void linkGuestOrdersToUser(user.id, user.email).catch(() => undefined);
      }

      return true;
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
