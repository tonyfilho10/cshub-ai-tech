"use client";

import { List } from "lucide-react";

export function PageOutline({ sections }: { sections: { id: string; label: string }[] }) {
  if (sections.length === 0) return null;

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="hidden lg:block fixed right-6 top-24 w-52 z-40">
      <div className="rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-card shadow-sm p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          <List size={12} />
          Nesta solicitação
        </p>
        <nav className="space-y-1">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollTo(s.id)}
              className="block w-full text-left text-xs text-navy-600 dark:text-navy-300 hover:text-accent-600 dark:hover:text-accent-400 rounded px-1.5 py-1 hover:bg-navy-50 dark:hover:bg-navy-800/60 transition truncate"
            >
              {s.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
