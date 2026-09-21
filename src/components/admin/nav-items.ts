//src/components/admin/nav-items.ts
import {
  ArrowLeftRight,
  Coins,
  History as HistoryIcon,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/server/domain/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Si se omite, lo ven todos los roles. */
  roles?: UserRole[];
  /** Activo solo con coincidencia exacta de la ruta. */
  exact?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    items: [
      { href: "/admin", label: "Panel", icon: LayoutDashboard, exact: true },
      { href: "/admin/currencies", label: "Monedas", icon: Coins, roles: ["ADMIN"] },
      { href: "/admin/rates", label: "Tasas", icon: ArrowLeftRight },
      { href: "/admin/history", label: "Historial", icon: HistoryIcon },
    ],
  },
  {
    label: "Administración",
    items: [
      { href: "/admin/settings", label: "Configuración", icon: Settings, roles: ["ADMIN"] },
      { href: "/admin/users", label: "Usuarios", icon: Users, roles: ["ADMIN"] },
    ],
  },
];