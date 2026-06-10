"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertProjectSpec } from "@/lib/actions/demands";

export function ProjectSpecForm({
  demandId,
  initialSpec,
  initialTechnologies,
}: {
  demandId: string;
  initialSpec: string;
  initialTechnologies: string;
}) {
  const [spec, setSpec] = useState(initialSpec);
  const [technologies, setTechnologies] = useState(initialTechnologies);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await upsertProjectSpec(demandId, spec, technologies);
        setSaved(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar especificação.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-4 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-navy-700">
        Especificação técnica do projeto
      </h3>
      <p className="mb-3 text-xs text-navy-400">
        Visível apenas para o time de desenvolvimento.
      </p>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-700">
            Tecnologias
          </label>
          <input
            type="text"
            value={technologies}
            onChange={(e) => setTechnologies(e.target.value)}
            placeholder="Ex: Next.js, Prisma, Supabase, Netlify"
            className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-700">
            Especificação técnica detalhada
          </label>
          <textarea
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            rows={10}
            placeholder="Arquitetura, modelos de dados, integrações, fluxos, etc."
            className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {saved && !error && <p className="mt-2 text-sm text-emerald-600">Especificação salva.</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-3 rounded-lg bg-navy-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-700 disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar especificação"}
      </button>
    </form>
  );
}
