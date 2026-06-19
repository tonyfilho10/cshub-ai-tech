"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Alternar tema"
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition text-[#c8d8ea] hover:bg-[#16294a]",
        collapsed && "justify-center px-0"
      )}
    >
      {theme === "dark" ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
      {!collapsed && <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>}
    </button>
  );
}
