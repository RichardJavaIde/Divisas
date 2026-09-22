//src/server/services/user.service.ts
import "server-only";
import { hashPassword } from "@/server/auth/password";
import type { UserRecord, UserRole } from "@/server/domain/types";
import { userRepository } from "@/server/repositories";

type UserErrorCode = "DUPLICATE_USERNAME" | "NOT_FOUND" | "LAST_ADMIN";

const MESSAGES: Record<UserErrorCode, string> = {
  DUPLICATE_USERNAME: "Ya existe un usuario con este nombre de usuario.",
  NOT_FOUND: "El usuario ya no existe.",
  LAST_ADMIN:
    "Debe quedar al menos un administrador activo. No puedes desactivar ni cambiar el rol del último.",
};

export class UserServiceError extends Error {
  readonly code: UserErrorCode;

  constructor(code: UserErrorCode) {
    super(MESSAGES[code]);
    this.name = "UserServiceError";
    this.code = code;
  }
}

export function listUsers() {
  return userRepository.listAll();
}

export function getUser(id: string) {
  return userRepository.findById(id);
}

export async function createUser(input: {
  username: string;
  name: string;
  password: string;
  role: UserRole;
}) {
  if (await userRepository.findCredentialsByUsername(input.username)) {
    throw new UserServiceError("DUPLICATE_USERNAME");
  }

  const passwordHash = await hashPassword(input.password);
  return userRepository.create({
    username: input.username,
    name: input.name,
    passwordHash,
    role: input.role,
  });
}

/**
 * Se dispara solo cuando un usuario deja de ser administrador activo
 * (lo desactivan, o le cambian el rol a OPERATOR estando activo).
 * Si en ese momento era el único ADMIN activo, se rechaza el cambio.
 */
async function assertNotRemovingLastAdmin(
  target: Pick<UserRecord, "role" | "isActive">,
  next: { role: UserRole; isActive: boolean },
) {
  const wasActiveAdmin = target.role === "ADMIN" && target.isActive;
  const staysActiveAdmin = next.role === "ADMIN" && next.isActive;

  if (wasActiveAdmin && !staysActiveAdmin) {
    const activeAdmins = await userRepository.countActiveByRole("ADMIN");
    if (activeAdmins <= 1) throw new UserServiceError("LAST_ADMIN");
  }
}

export async function updateUserProfile(
  id: string,
  data: { name: string; role: UserRole; isActive: boolean },
) {
  const target = await userRepository.findById(id);
  if (!target) throw new UserServiceError("NOT_FOUND");

  await assertNotRemovingLastAdmin(target, data);

  return userRepository.update(id, data);
}

/** Igual que updateUserProfile pero solo toca isActive (usado por el interruptor del listado). */
export async function setUserActive(id: string, isActive: boolean) {
  const target = await userRepository.findById(id);
  if (!target) throw new UserServiceError("NOT_FOUND");

  return updateUserProfile(id, { name: target.name, role: target.role, isActive });
}

export async function resetUserPassword(id: string, password: string) {
  if (!(await userRepository.findById(id))) throw new UserServiceError("NOT_FOUND");
  await userRepository.setPassword(id, await hashPassword(password));
}