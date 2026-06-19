"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePriority } from "@/lib/actions/demands";
import { PRIORITY_OPTIONS } from "@/components/PriorityBadge";
import type { Priority } from "@prisma/client";

const COLOR: Record<Priority, string> = {
  BAIXA:   "text-slate-600 dark:text-slate-300",
  MEDIA:   "text-sky-700 dark:text-sky-400",
  ALTA:    "text-amber-700 dark:text-amber-400",
  URGENTE: "text-red-700 dark:text-red-400",
};

export function PrioritySelector({
  demandId,
  priority,
}: {
  demandId: string;
  priority: Priority;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Priority;
    startTransition(async () => {
      await updatePriority(demandId, next);
      router.refresh();
    });
  }

  return (
    <select
      value={priority}
      onChange={handleChange}
      disabled={pending}
      className={`rounded-full border px-2 py-0.5 text-xs font-medium bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-400 disabled:opacity-50 ${COLOR[priority]} border-current`}
    >
      {PRIORITY_OPTIONS.map((o) => (
        <option key={o.value} value={o.value} className="text-foreground bg-background">
          {o.label}
        </option>
      ))}
    </select>
  );
}
