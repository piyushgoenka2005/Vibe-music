import "server-only";

import { randomUUID } from "node:crypto";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter, AdapterUser } from "@auth/core/adapters";
import type { PrismaClient } from "@prisma/client";

/**
 * Auth.js PrismaAdapter strips `id` and does not know about our required
 * `createdAt` / `isActive` columns. Google OAuth user creation then fails and
 * Auth.js surfaces it as a Configuration/Callback error.
 */
export function createAuthPrismaAdapter(client: PrismaClient): Adapter {
  const base = PrismaAdapter(client);

  return {
    ...base,
    async createUser(data) {
      const now = new Date().toISOString();
      const id = data.id?.trim() || randomUUID();

      const user = await client.user.create({
        data: {
          id,
          email: data.email!.trim().toLowerCase(),
          emailVerified: data.emailVerified ?? new Date(),
          name: data.name?.trim() || data.email!.split("@")[0] || "User",
          image: data.image ?? null,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      });

      return user as AdapterUser;
    },
    async updateUser(data) {
      const { id, ...rest } = data;
      if (!id) throw new Error("Adapter updateUser requires an id");

      const user = await client.user.update({
        where: { id },
        data: {
          ...(rest.email != null
            ? { email: String(rest.email).trim().toLowerCase() }
            : {}),
          ...(rest.name !== undefined ? { name: rest.name } : {}),
          ...(rest.image !== undefined ? { image: rest.image } : {}),
          ...(rest.emailVerified !== undefined
            ? { emailVerified: rest.emailVerified }
            : {}),
          updatedAt: new Date().toISOString(),
        },
      });

      return user as AdapterUser;
    },
  };
}
