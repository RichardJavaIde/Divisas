//src/server/repositories/session.repository.ts
import "server-only";
import { prisma, type DbClient } from "@/server/db/client";
import type { SessionWithUser, UserRole } from "@/server/domain/types";
import { USER_ROLES } from "@/server/domain/types";

export async function create(
  input: {
    tokenHash: string;
    userId: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  },
  db: DbClient = prisma,
): Promise<void> {
  await db.session.create({
    data: {
      tokenHash: input.tokenHash,
      userId: input.userId,
      expiresAt: input.expiresAt,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent?.slice(0, 255) ?? null,
    },
  });
}

/** Devuelve la sesión solo si no expiró y el usuario sigue activo. */
export async function findValidByTokenHash(
  tokenHash: string,
  now: Date = new Date(),
  db: DbClient = prisma,
): Promise<SessionWithUser | null> {
  const row = await db.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!row || row.expiresAt <= now || !row.user.isActive) return null;

  const role: UserRole = (USER_ROLES as readonly string[]).includes(row.user.role)
    ? (row.user.role as UserRole)
    : "OPERATOR";

  return {
    id: row.id,
    expiresAt: row.expiresAt,
    user: {
      id: row.user.id,
      username: row.user.username,
      name: row.user.name,
      role,
      isActive: row.user.isActive,
      lastLoginAt: row.user.lastLoginAt,
      createdAt: row.user.createdAt,
    },
  };
}

export async function touch(id: string, db: DbClient = prisma): Promise<void> {
  await db.session.update({ where: { id }, data: { lastUsedAt: new Date() } });
}

export async function deleteByTokenHash(
  tokenHash: string,
  db: DbClient = prisma,
): Promise<void> {
  await db.session.deleteMany({ where: { tokenHash } });
}

export async function deleteAllForUser(
  userId: string,
  db: DbClient = prisma,
): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}

export async function deleteExpired(
  now: Date = new Date(),
  db: DbClient = prisma,
): Promise<number> {
  const result = await db.session.deleteMany({ where: { expiresAt: { lte: now } } });
  return result.count;
}