//src/components/admin/logo-manager.tsx
"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LOGO_ACCEPT, MAX_LOGO_BYTES, MAX_LOGO_LABEL, isAllowedLogoType } from "@/lib/logo";
import { removeLogoAction, uploadLogoAction } from "@/server/actions/settings.actions";
import type { LogoActionState } from "@/server/validation/settings";

const initialState: LogoActionState = {};

function LogoPreview({ src }: { src: string | null }) {
  return (
    <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-surface-muted">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Logo actual" className="size-full object-contain p-2" />
      ) : (
        <ImageIcon className="size-8 text-ink-muted" aria-hidden />
      )}
    </div>
  );
}

export function LogoManager({
  hasLogo,
  logoVersion,
}: {
  hasLogo: boolean;
  logoVersion: number;
}) {
  const router = useRouter();
  const [uploadState, uploadAction, uploading] = useActionState(uploadLogoAction, initialState);
  const [removing, startRemove] = useTransition();
  const [removeError, setRemoveError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLFormElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);

  // Tras subir o quitar el logo, se refrescan los datos del servidor (hasLogo, versión)
  useEffect(() => {
    if (uploadState.success) {
      router.refresh();
      setLocalPreview(null);
      fileInputRef.current?.reset();
    }
  }, [uploadState.success, router]);

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setPickError(null);
    const file = event.target.files?.[0];
    if (!file) {
      setLocalPreview(null);
      return;
    }

    if (!isAllowedLogoType(file.type)) {
      setPickError("Formato no admitido. Usa PNG, JPG o WEBP.");
      event.target.value = "";
      setLocalPreview(null);
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setPickError(`La imagen no puede superar ${MAX_LOGO_LABEL}.`);
      event.target.value = "";
      setLocalPreview(null);
      return;
    }

    setLocalPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });
  }

  function remove() {
    if (!window.confirm("¿Quitar el logo actual? La pantalla pública mostrará un ícono genérico.")) {
      return;
    }
    setRemoveError(null);
    startRemove(async () => {
      const result = await removeLogoAction();
      if (result.error) setRemoveError(result.error);
      else router.refresh();
    });
  }

  const currentSrc = hasLogo ? `/api/logo?v=${logoVersion}` : null;

  return (
    <div className="space-y-5">
      {uploadState.error && <Alert>{uploadState.error}</Alert>}
      {pickError && <Alert>{pickError}</Alert>}
      {removeError && <Alert>{removeError}</Alert>}
      {uploadState.success && <Alert variant="success">Logo actualizado.</Alert>}

      <div className="flex items-center gap-4">
        <LogoPreview src={localPreview ?? currentSrc} />
        <div className="min-w-0 text-sm text-ink-muted">
          <p>PNG, JPG o WEBP</p>
          <p>Máximo {MAX_LOGO_LABEL}</p>
          <p>Fondo transparente recomendado</p>
        </div>
      </div>

      <form ref={fileInputRef} action={uploadAction} className="space-y-3">
        <input
          type="file"
          name="logo"
          accept={LOGO_ACCEPT}
          onChange={onFileChange}
          className="block w-full cursor-pointer text-sm text-ink file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={uploading} size="sm">
            <Upload className="size-4" aria-hidden />
            {hasLogo ? "Reemplazar logo" : "Subir logo"}
          </Button>
          {hasLogo && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={removing}
              onClick={remove}
            >
              <Trash2 className="size-4" aria-hidden />
              Quitar logo
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}