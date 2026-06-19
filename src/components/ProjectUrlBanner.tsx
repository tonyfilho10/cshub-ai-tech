"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Pencil, Link2, Check, X } from "lucide-react";
import { upsertProjectUrl } from "@/lib/actions/demands";
import { cn } from "@/lib/utils";
import type { DemandStatus } from "@prisma/client";

export function ProjectUrlBanner({
  demandId,
  projectUrl,
  status,
  isDevTeam,
}: {
  demandId: string;
  projectUrl: string | null;
  status: DemandStatus;
  isDevTeam: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(projectUrl ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (status !== "EM_TESTE" && status !== "EM_PRODUCAO") return null;

  const isProducao = status === "EM_PRODUCAO";
  const label = isProducao ? "Acesso ao projeto em produção" : "Acesso ao ambiente de teste";
  const colors = isProducao
    ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400"
    : "border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 text-amber-800 dark:text-amber-400";

  function handleSave() {
    setError(null);
    if (!url.trim()) return;
    startTransition(async () => {
      try {
        await upsertProjectUrl(demandId, url);
        setEditing(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao salvar link.");
      }
    });
  }

  if (editing) {
    return (
      <div className={cn("space-y-2 rounded-lg border p-3", colors)} onClick={(e) => e.stopPropagation()}>
        <p className="text-xs font-medium flex items-center gap-1.5">
          <Link2 size={13} />
          {label}
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            autoFocus
            className="flex-1 rounded-lg border border-navy-200 dark:border-navy-700 bg-background px-3 py-1.5 text-sm text-navy-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-accent-400"
          />
          <button
            type="button"
            disabled={pending || !url.trim()}
            onClick={handleSave}
            className="flex items-center gap-1 rounded-lg bg-navy-800 dark:bg-navy-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-700 disabled:opacity-40"
          >
            <Check size={12} /> Salvar
          </button>
          <button
            type="button"
            onClick={() => { setEditing(false); setUrl(projectUrl ?? ""); setError(null); }}
            className="flex items-center gap-1 rounded-lg border border-navy-200 dark:border-navy-700 px-3 py-1.5 text-xs text-navy-600 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-800"
          >
            <X size={12} /> Cancelar
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (!projectUrl) {
    return isDevTeam ? (
      <div className={cn("flex items-center justify-between gap-2 rounded-lg border p-3", colors)} onClick={(e) => e.stopPropagation()}>
        <p className="text-xs font-medium flex items-center gap-1.5">
          <Link2 size={13} />
          Nenhum link informado ainda.
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 flex items-center gap-1 rounded-lg bg-navy-800 dark:bg-navy-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-navy-700"
        >
          <Pencil size={11} /> Adicionar link
        </button>
      </div>
    ) : (
      <div className={cn("rounded-lg border p-3 text-xs", colors)}>
        O time de desenvolvimento ainda não informou o link de acesso.
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-between gap-2 rounded-lg border p-3", colors)} onClick={(e) => e.stopPropagation()}>
      <a
        href={projectUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 items-center gap-1.5 text-xs font-medium hover:underline"
      >
        <ExternalLink size={13} className="shrink-0" />
        <span className="truncate">{label}: {projectUrl}</span>
      </a>
      {isDevTeam && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 rounded-lg p-1 hover:bg-white/50 dark:hover:bg-black/20 transition"
          aria-label="Editar link"
        >
          <Pencil size={12} />
        </button>
      )}
    </div>
  );
}
