import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  id?: string;
}

export async function createAuthUser(input: CreateUserInput): Promise<{
  id: string;
  email: string;
  name: string;
}> {
  const id = input.id ?? randomUUID();
  const email = input.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      id,
      email,
      name: input.name.trim(),
      passwordHash,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? "",
  };
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function updateUserDisplayName(
  userId: string,
  displayName: string
): Promise<void> {
  const now = new Date().toISOString();
  await prisma.user.update({
    where: { id: userId },
    data: { name: displayName.trim(), updatedAt: now },
  });
}

export async function updateUserProfile(
  userId: string,
  input: {
    displayName?: string;
    phone?: string;
    dateOfBirth?: string;
  }
): Promise<{ name: string | null; phone: string | null; dateOfBirth: string | null }> {
  const now = new Date().toISOString();
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.displayName != null
        ? { name: input.displayName.trim() }
        : {}),
      ...(input.phone != null ? { phone: input.phone.trim() || null } : {}),
      ...(input.dateOfBirth != null
        ? { dateOfBirth: input.dateOfBirth.trim() || null }
        : {}),
      updatedAt: now,
    },
    select: {
      name: true,
      phone: true,
      dateOfBirth: true,
    },
  });
  return user;
}

export async function updateUserPassword(
  userId: string,
  password: string
): Promise<void> {
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, updatedAt: now },
  });
}

export async function ensureOAuthUserProfile(input: {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<{ id: string }> {
  const now = new Date().toISOString();
  const email = input.email.trim().toLowerCase();
  const displayName = input.name?.trim() || email.split("@")[0] || "User";

  const byId = await prisma.user.findUnique({ where: { id: input.id } });
  if (byId) {
    // Avoid unique collisions if another row already owns this email.
    const emailOwner =
      byId.email === email
        ? byId
        : await prisma.user.findUnique({ where: { email } });
    if (emailOwner && emailOwner.id !== byId.id) {
      await prisma.user.update({
        where: { id: emailOwner.id },
        data: {
          name: displayName || emailOwner.name,
          image: input.image ?? emailOwner.image,
          emailVerified: new Date(),
          isActive: true,
          updatedAt: now,
        },
      });
      return { id: emailOwner.id };
    }

    await prisma.user.update({
      where: { id: byId.id },
      data: {
        email,
        name: displayName || byId.name,
        image: input.image ?? byId.image,
        emailVerified: new Date(),
        isActive: true,
        updatedAt: now,
      },
    });
    return { id: byId.id };
  }

  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    await prisma.user.update({
      where: { id: byEmail.id },
      data: {
        name: displayName || byEmail.name,
        image: input.image ?? byEmail.image,
        emailVerified: new Date(),
        isActive: true,
        updatedAt: now,
      },
    });
    return { id: byEmail.id };
  }

  await prisma.user.create({
    data: {
      id: input.id,
      email,
      name: displayName,
      image: input.image ?? null,
      emailVerified: new Date(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });
  return { id: input.id };
}
