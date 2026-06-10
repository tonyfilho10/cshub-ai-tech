"use client";

import { useActionState } from "react";
import { createDemand, type DemandFormState } from "@/lib/actions/demands";

const initialState: DemandFormState = { error: null };

export default function NovaDemandaPage() {
  const [state, formAction, pending] = useActionState(createDemand, initialState);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold text-navy-900">Nova Demanda</h1>
      <p className="mb-6 text-sm text-navy-400">
        Descreva a necessidade do seu setor. O time de desenvolvimento irá analisar
        e retornar com um parecer.
      </p>

      <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-700">Título</label>
          <input
            type="text"
            name="title"
            required
            placeholder="Ex: Sistema de controle de estoque"
            className="w-full rounded-lg border border-navy-200 px-3 py-2 text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-700">Descrição</label>
          <textarea
            name="description"
            required
            rows={6}
            placeholder="Descreva o problema, o objetivo e o impacto esperado..."
            className="w-full rounded-lg border border-navy-200 px-3 py-2 text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-navy-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-navy-700 disabled:opacity-60"
        >
          {pending ? "Enviando..." : "Enviar demanda"}
        </button>
      </form>
    </div>
  );
}
