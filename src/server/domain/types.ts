//src/server/domain/types.ts
export const USER_ROLES = ["ADMIN", "OPERATOR"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface UserRecord {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

/** Solo para autenticación. Nunca se envía al cliente. */
export interface UserCredentials extends UserRecord {
  passwordHash: string;
  failedAttempts: number;
  lockedUntil: Date | null;
}

export interface SessionWithUser {
  id: string;
  expiresAt: Date;
  user: UserRecord;
}

export interface CurrencyRecord {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  flagCode: string | null;
  buyRate: number;
  sellRate: number;
  displayOrder: number;
  isActive: boolean;
  ratesUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RateHistoryRecord {
  id: string;
  currencyId: string;
  currencyCode: string;
  previousBuyRate: number | null;
  previousSellRate: number | null;
  newBuyRate: number;
  newSellRate: number;
  changedAt: Date;
  changedById: string | null;
  changedByName: string;
}

export interface CompanySettingsRecord {
  companyName: string;
  logoPath: string | null;
  footerNote: string | null;
  refreshSeconds: number;
  updatedAt: Date;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}