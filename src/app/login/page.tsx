"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type AuthFormState } from "@/lib/actions/auth";
import { AuthCard } from "@/components/AuthCard";

const initialState: AuthFormState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <AuthCard
      title="Entrar"
      subtitle="Plataforma de Demandas de Desenvolvimento - CSHUB"
    >
      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-700">
            E-mail
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-lg border border-navy-200 px-3 py-2 text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-700">
            Senha
          </label>
          <input
            type="password"
            name="password"
            required
            className="w-full rounded-lg border border-navy-200 px-3 py-2 text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-navy-800 px-4 py-2.5 font-medium text-white transition hover:bg-navy-700 disabled:opacity-60"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-navy-400">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-accent-600 hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthCard>
  );
}
