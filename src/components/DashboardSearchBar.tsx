"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function DashboardSearchBar() {
  const [value, setValue] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    router.push(`/demandas?q=${encodeURIComponent(value.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-sm">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar solicitações..."
        className="w-full rounded-lg border border-navy-200 dark:border-navy-700 bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
      />
    </form>
  );
}
