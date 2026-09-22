#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { copyFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DB_PATH = join(ROOT, "data", "exchange.db");
const BACKUP_DIR = join(ROOT, "backups");
const KEEP_DAYS = 30; // respaldos más viejos que esto se borran

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function main() {
  if (!existsSync(DB_PATH)) {
    console.error(`✘ No se encontró la base de datos en ${DB_PATH}`);
    process.exit(1);
  }

  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

  const target = join(BACKUP_DIR, `exchange-${timestamp()}.db`);
  copyFileSync(DB_PATH, target);
  console.log(`✔ Respaldo creado: ${target}`);

  // Limpieza de respaldos viejos
  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
  let removed = 0;
  for (const file of readdirSync(BACKUP_DIR)) {
    const filePath = join(BACKUP_DIR, file);
    if (statSync(filePath).mtimeMs < cutoff) {
      unlinkSync(filePath);
      removed += 1;
    }
  }
  if (removed > 0) console.log(`• Se eliminaron ${removed} respaldo(s) de más de ${KEEP_DAYS} días.`);
}

main();