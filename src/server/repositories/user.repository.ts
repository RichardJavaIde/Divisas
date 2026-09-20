//src/server/repositories/user.repository.ts
import "server-only";
import type { User as UserRow } from "@prisma/client";
import { prisma, type DbClient } from "@/server/db/client";
import {
  USER_ROLES,
  type UserCredentials,
  type UserRecord,
  type UserRole,
} from "@/server/domain/types";

const normalizeUsername = (value: string) => value.trim().toLowerCase();

function toRole(value: string): UserRole {
  // Si el valor no es reconocido, se asigna el rol con menos privilegios
  return (USER_ROLES as readonly string[]).includes(value)
    ? (value as UserRole)
    : "OPERATOR";
}

function toRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: toRole(row.role),
    isActive: row.isActive,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
  };
}

function toCredentials(row: UserRow): UserCredentials {
  return {
    ...toRecord(row),
    passwordHash: row.passwordHash,
    failedAttempts: row.failedAttempts,
    lockedUntil: row.lockedUntil,
  };
}

export async function findById(
  id: string,
  db: DbClient = prisma,
): Promise<UserRecord | null> {
  const row = await db.user.findUnique({ where: { id } });
  return row ? toRecord(row) : null;
}

export async function findCredentialsByUsername(
  username: string,
  db: DbClient = prisma,
): Promise<UserCredentials | null> {
  const row = await db.user.findUnique({
    where: { username: normalizeUsername(username) },
  });
  return row ? toCredentials(row) : null;
}

export async function listAll(db: DbClient = prisma): Promise<UserRecord[]> {
  const rows = await db.user.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(toRecord);
}

export async function create(
  input: {
    username: string;
    name: string;
    passwordHash: string;
    role?: UserRole;
  },
  db: DbClient = prisma,
): Promise<UserRecord> {
  const row = await db.user.create({
    data: {
      username: normalizeUsername(input.username),
      name: input.name.trim(),
      passwordHash: input.passwordHash,
      role: input.role ?? "OPERATOR",
    },
  });
  return toRecord(row);
}

export async function update(
  id: string,
  data: { name?: string; role?: UserRole; isActive?: boolean },
  db: DbClient = prisma,
): Promise<UserRecord> {
  const row = await db.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.role !== undefined && { role: data.role }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
  return toRecord(row);
}

export async function setPassword(
  id: string,
  passwordHash: string,
  db: DbClient = prisma,
): Promise<void> {
  await db.user.update({
    where: { id },
    data: { passwordHash, failedAttempts: 0, lockedUntil: null },
  });
}

export async function registerLoginSuccess(
  id: string,
  db: DbClient = prisma,
): Promise<void> {
  await db.user.update({
    where: { id },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
}

export async function registerLoginFailure(
  id: string,
  lockUntil: Date | null,
  db: DbClient = prisma,
): Promise<void> {
  await db.user.update({
    where: { id },
    data: {
      failedAttempts: { increment: 1 },
      ...(lockUntil && { lockedUntil: lockUntil }),
    },
  });
}

export async function countActiveByRole(
  role: UserRole,
  db: DbClient = prisma,
): Promise<number> {
  return db.user.count({ where: { role, isActive: true } });
}