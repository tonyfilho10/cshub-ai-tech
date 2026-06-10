"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  PlusCircle,
  Archive,
  Building2,
  Users,
  ChevronsLeft,
  ChevronsRight,
  type LucideIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
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
    <aside
      className={cn(
        "flex h-full flex-col bg-navy-900 text-white transition-[width] duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-400 text-sm font-bold text-navy-900">
          CS
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="truncate text-sm font-semibold leading-tight">CSHUB</p>
            <p className="truncate text-xs text-navy-300">Demandas de TI</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-2.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          const link = (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                collapsed && "justify-center px-0",
                active
                  ? "bg-accent-400 text-navy-900"
                  : "text-navy-100 hover:bg-navy-700"
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );

          if (!collapsed) return link;

          return (
            <Tooltip key={href}>
              <TooltipTrigger render={link} />
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="px-2.5 pb-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            "text-navy-300 hover:bg-navy-700 hover:text-white",
            collapsed ? "mx-auto flex" : "ml-auto flex"
          )}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </Button>
      </div>

      {!collapsed && (
        <div className="px-3 pb-5 text-xs text-navy-400">
          © {new Date().getFullYear()} CSHUB
        </div>
      )}
    </aside>
  );
}
