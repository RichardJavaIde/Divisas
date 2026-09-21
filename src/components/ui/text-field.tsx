//src/components/ui/text-field.tsx
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Input, Label } from "./input";

type TextFieldProps = Omit<ComponentProps<"input">, "id" | "name"> & {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  /** Contenido a la derecha dentro del campo (por ejemplo, una vista previa). */
  trailing?: ReactNode;
};

export function TextField({
  name,
  label,
  error,
  hint,
  optional,
  trailing,
  className,
  ...props
}: TextFieldProps) {
  const messageId = error ? `${name}-error` : hint ? `${name}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label}
        {optional && <span className="ml-1.5 font-normal text-ink-muted">(opcional)</span>}
      </Label>

      <div className="relative">
        <Input
          id={name}
          name={name}
          invalid={Boolean(error)}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className={cn(trailing && "pr-14", className)}
          {...props}
        />
        {trailing && (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-2xl">
            {trailing}
          </div>
        )}
      </div>

      {error ? (
        <p id={`${name}-error`} className="text-sm text-sell">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}