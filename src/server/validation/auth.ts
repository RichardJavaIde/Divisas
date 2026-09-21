//src/server/validation/auth.ts
import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(200),
});

/** Estado que devuelve la acción de login al formulario. */
export interface LoginFormState {
  error?: string;
  username?: string;
}