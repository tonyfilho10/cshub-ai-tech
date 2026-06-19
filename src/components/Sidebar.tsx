"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Archive,
  Building2,
  Users,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Grid2x2,
  type LucideIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/actions/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { UserAvatar } from "@/components/UserAvatar";
import { ProfileDialog } from "@/components/ProfileDialog";
import type { UserRole } from "@prisma/client";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function Sidebar({
  role,
  name,
  department,
  avatarUrl,
  userId,
  email,
}: {
  role: UserRole;
  name: string;
  department: string;
  avatarUrl: string | null;
  userId: string;
  email: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isDevTeam = role === "DEV_TEAM" || role === "ADMIN";
  const isAdmin = role === "ADMIN";

  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/demandas", label: "Solicitações", icon: ClipboardList },
  ];

  if (isDevTeam) {
    items.push({ href: "/demandas/arquivadas", label: "Arquivadas", icon: Archive });
    items.push({ href: "/demandas/eisenhower", label: "Matriz Eisenhower", icon: Grid2x2 });
  }

  if (isAdmin) {
    items.push({ href: "/admin/setores", label: "Setores", icon: Building2 });
    items.push({ href: "/admin/usuarios", label: "Usuários", icon: Users });
  }

  return (
    <aside
      className={cn(
        "flex h-screen flex-col bg-[#0b1f3a] text-white transition-[width] duration-200 sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-3 py-5", collapsed ? "justify-center px-0" : "px-4")}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-400 text-sm font-bold text-navy-900">
          CS
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="truncate text-sm font-semibold leading-tight">CSHUB</p>
            <p className="truncate text-xs text-[#84a3c9]">Solicitações de Desenvolvimento</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={cn("flex-1 space-y-1", collapsed ? "px-0" : "px-2.5")}>
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
                  ? "bg-accent-400 text-[#0b1f3a]"
                  : "text-[#c8d8ea] hover:bg-[#16294a]"
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

      {/* Collapse toggle */}
      <div className={cn("pb-2", collapsed ? "flex justify-center px-0" : "px-2.5")}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            "text-[#84a3c9] hover:bg-[#16294a] hover:text-white",
            collapsed ? "mx-auto flex" : "ml-auto flex"
          )}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </Button>
      </div>

      {/* User + logout */}
      <div className={cn("border-t border-[#16294a] py-4", collapsed ? "px-0 flex justify-center" : "px-3")}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="mx-auto flex">
                <UserAvatar name={name} avatarUrl={avatarUrl} size="sm" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{name} · Perfil</TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3">
            <ProfileDialog
              name={name}
              email={email}
              role={ROLE_LABELS[role]}
              department={department}
              avatarUrl={avatarUrl}
              userId={userId}
            >
              <UserAvatar name={name} avatarUrl={avatarUrl} size="sm" className="cursor-pointer hover:opacity-80 transition" />
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium text-white">{name}</p>
                <p className="truncate text-xs text-[#84a3c9]">
                  {ROLE_LABELS[role]} · {department}
                </p>
              </div>
            </ProfileDialog>
            <form action={logout}>
              <button
                type="submit"
                className="text-[#84a3c9] hover:text-white transition"
                aria-label="Sair"
              >
                <LogOut size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
}
