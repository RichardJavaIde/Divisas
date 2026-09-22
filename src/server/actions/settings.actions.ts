//src/server/actions/settings.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/auth/session";
import {
  SettingsServiceError,
  removeCompanyLogo,
  replaceLogo,
  updateCompanySettings,
} from "@/server/services/settings.service";
import {
  collectFieldErrors,
  companySettingsSchema,
  type LogoActionState,
  type SettingsFormState,
  type SettingsFormValues,
} from "@/server/validation/settings";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.slice(0, 200) : "";
}

function refreshCompanyViews() {
  // El nombre de la compañía aparece en /, /login y en el panel; el logo solo en /
  revalidatePath("/");
  revalidatePath("/login");
  revalidatePath("/admin", "layout");
}

export async function updateCompanySettingsAction(
  _previous: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireRole("ADMIN");

  const values: SettingsFormValues = {
    companyName: text(formData, "companyName"),
    footerNote: text(formData, "footerNote"),
    refreshSeconds: text(formData, "refreshSeconds"),
  };

  const parsed = companySettingsSchema.safeParse(values);
  if (!parsed.success) {
    return { values, fieldErrors: collectFieldErrors(parsed.error) };
  }

  try {
    await updateCompanySettings(parsed.data);
  } catch (error) {
    console.error(error);
    return { values, error: "No se pudo guardar. Inténtalo de nuevo." };
  }

  refreshCompanyViews();
  return { values, success: true };
}

export async function uploadLogoAction(
  _previous: LogoActionState,
  formData: FormData,
): Promise<LogoActionState> {
  await requireRole("ADMIN");

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona una imagen." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await replaceLogo({ buffer, mimeType: file.type, size: file.size });
  } catch (error) {
    if (error instanceof SettingsServiceError) return { error: error.message };
    console.error(error);
    return { error: "No se pudo guardar el logo. Inténtalo de nuevo." };
  }

  refreshCompanyViews();
  return { success: true };
}

export async function removeLogoAction(): Promise<LogoActionState> {
  await requireRole("ADMIN");

  try {
    await removeCompanyLogo();
  } catch (error) {
    console.error(error);
    return { error: "No se pudo quitar el logo. Inténtalo de nuevo." };
  }

  refreshCompanyViews();
  return { success: true };
}