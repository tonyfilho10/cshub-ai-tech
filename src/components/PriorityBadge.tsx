import type { Priority } from "@prisma/client";

const CONFIG: Record<Priority, { label: string; className: string }> = {
  BAIXA:   { label: "Baixa",   className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  MEDIA:   { label: "Média",   className: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" },
  ALTA:    { label: "Alta",    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  URGENTE: { label: "Urgente", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, className } = CONFIG[priority];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "BAIXA",   label: "Baixa" },
  { value: "MEDIA",   label: "Média" },
  { value: "ALTA",    label: "Alta" },
  { value: "URGENTE", label: "Urgente" },
];
