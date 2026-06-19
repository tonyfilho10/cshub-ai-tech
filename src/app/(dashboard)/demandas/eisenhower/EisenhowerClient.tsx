"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { Priority, SuggestionStatus } from "@prisma/client";

type Suggestion = {
  id: string;
  content: string;
  status: SuggestionStatus;
  createdAt: Date;
  author: { name: string };
  demand: {
    id: string;
    title: string;
    priority: Priority;
    department: { name: string };
  };
};

const QUADRANTS: {
  priority: Priority;
  label: string;
  sub: string;
  colors: { border: string; header: string; dot: string; badge: string; card: string };
}[] = [
  {
    priority: "URGENTE",
    label: "Faça agora",
    sub: "Urgente · Importante",
    colors: {
      border: "border-red-200 dark:border-red-900",
      header: "bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900",
      dot: "bg-red-500",
      badge: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
      card: "hover:border-red-300 dark:hover:border-red-700",
    },
  },
  {
    priority: "ALTA",
    label: "Agende",
    sub: "Importante · Não urgente",
    colors: {
      border: "border-amber-200 dark:border-amber-900",
      header: "bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900",
      dot: "bg-amber-500",
      badge: "text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
      card: "hover:border-amber-300 dark:hover:border-amber-700",
    },
  },
  {
    priority: "MEDIA",
    label: "Delegue",
    sub: "Urgente · Não importante",
    colors: {
      border: "border-sky-200 dark:border-sky-900",
      header: "bg-sky-50 dark:bg-sky-900/20 border-b border-sky-100 dark:border-sky-900",
      dot: "bg-sky-500",
      badge: "text-sky-700 bg-sky-100 dark:bg-sky-900/30 dark:text-sky-400",
      card: "hover:border-sky-300 dark:hover:border-sky-700",
    },
  },
  {
    priority: "BAIXA",
    label: "Elimine",
    sub: "Não urgente · Não importante",
    colors: {
      border: "border-slate-200 dark:border-slate-700",
      header: "bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-700",
      dot: "bg-slate-400",
      badge: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400",
      card: "hover:border-slate-300 dark:hover:border-slate-600",
    },
  },
];

export function EisenhowerClient({ suggestions }: { suggestions: Suggestion[] }) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? suggestions.filter(
        (s) =>
          s.content.toLowerCase().includes(search.toLowerCase()) ||
          s.demand.title.toLowerCase().includes(search.toLowerCase()) ||
          s.demand.department.name.toLowerCase().includes(search.toLowerCase()) ||
          s.author.name.toLowerCase().includes(search.toLowerCase())
      )
    : suggestions;

  const total = filtered.length;

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar sugestão, demanda ou setor..."
          className="w-full rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-card pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>

      {total === 0 && (
        <p className="text-sm text-muted-foreground">
          {search ? "Nenhuma sugestão encontrada." : "Nenhuma sugestão pendente nas solicitações em produção."}
        </p>
      )}

      {/* 2×2 grid */}
      {total > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {QUADRANTS.map((q) => {
            const items = filtered.filter((s) => s.demand.priority === q.priority);
            return (
              <div
                key={q.priority}
                className={`rounded-xl border ${q.colors.border} bg-white dark:bg-card overflow-hidden`}
              >
                {/* Quadrant header */}
                <div className={`px-4 py-3 ${q.colors.header}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${q.colors.dot}`} />
                      <span className="text-sm font-semibold text-navy-800 dark:text-foreground">{q.label}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${q.colors.badge}`}>
                      {items.length}
                    </span>
                  </div>
                  <p className="mt-0.5 ml-4 text-xs text-muted-foreground">{q.sub}</p>
                </div>

                {/* Items */}
                <div className="divide-y divide-navy-50 dark:divide-navy-800/50 max-h-72 overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="px-4 py-5 text-xs text-muted-foreground italic text-center">Nenhuma sugestão</p>
                  ) : (
                    items.map((s) => (
                      <Link
                        key={s.id}
                        href={`/demandas/${s.demand.id}`}
                        className={`block px-4 py-3 transition border border-transparent ${q.colors.card}`}
                      >
                        <p className="text-xs text-navy-700 dark:text-foreground/80 line-clamp-2 leading-relaxed">
                          {s.content}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-medium text-navy-500 dark:text-navy-400 truncate max-w-[140px]">
                            {s.demand.title}
                          </span>
                          <span className="text-[11px] text-muted-foreground">·</span>
                          <span className="text-[11px] text-muted-foreground">{s.demand.department.name}</span>
                          {s.status === "APROVADO" && (
                            <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 text-[10px] font-medium">
                              Aprovada
                            </span>
                          )}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
