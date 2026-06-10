"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  PlusCircle,
  Archive,
  Building2,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@prisma/client";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const isDevTeam = role === "DEV_TEAM" || role === "ADMIN";
  const isAdmin = role === "ADMIN";

  const items: NavItem[] = [
    { href: "/demandas", label: "Demandas", icon: ClipboardList },
    { href: "/demandas/nova", label: "Nova Demanda", icon: PlusCircle },
  ];

  if (isDevTeam) {
    items.push({ href: "/demandas/arquivadas", label: "Arquivadas", icon: Archive });
  }

  if (isAdmin) {
    items.push({ href: "/admin/setores", label: "Setores", icon: Building2 });
    items.push({ href: "/admin/usuarios", label: "Usuários", icon: Users });
  }

  return (
    <aside className="flex h-full w-64 flex-col bg-navy-900 text-white">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-400 text-sm font-bold text-navy-900">
          CS
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">CSHUB</p>
          <p className="text-xs text-navy-300">Demandas de TI</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-accent-400 text-navy-900"
                  : "text-navy-100 hover:bg-navy-700"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-5 text-xs text-navy-400">
        © {new Date().getFullYear()} CSHUB
      </div>
    </aside>
  );
}
