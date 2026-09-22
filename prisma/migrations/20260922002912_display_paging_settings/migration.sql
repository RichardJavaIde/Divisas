-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_company_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "companyName" TEXT NOT NULL DEFAULT 'Casa de Cambio',
    "logoData" BLOB,
    "logoMimeType" TEXT,
    "footerNote" TEXT,
    "refreshSeconds" INTEGER NOT NULL DEFAULT 30,
    "rowsPerPage" INTEGER NOT NULL DEFAULT 12,
    "rotationSeconds" INTEGER NOT NULL DEFAULT 15,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_company_settings" ("companyName", "footerNote", "id", "logoData", "logoMimeType", "refreshSeconds", "updatedAt") SELECT "companyName", "footerNote", "id", "logoData", "logoMimeType", "refreshSeconds", "updatedAt" FROM "company_settings";
DROP TABLE "company_settings";
ALTER TABLE "new_company_settings" RENAME TO "company_settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
