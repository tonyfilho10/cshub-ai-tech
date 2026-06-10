"use client";

import { useActionState } from "react";
import { createDepartment, type SimpleFormState } from "@/lib/actions/admin";

const initialState: SimpleFormState = { error: null };

export function NewDepartmentForm() {
  const [state, formAction, pending] = useActionState(createDepartment, initialState);

  return (
    <form action={formAction} className="flex items-start gap-2">
      <div className="flex-1">
        <input
          type="text"
          name="name"
          placeholder="Nome do novo setor"
          className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        />
        {state.error && <p className="mt-1 text-sm text-red-600">{state.error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-navy-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-700 disabled:opacity-60"
      >
        {pending ? "Adicionando..." : "Adicionar"}
      </button>
    </form>
  );
}
