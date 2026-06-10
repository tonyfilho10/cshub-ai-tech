"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type AuthFormState } from "@/lib/actions/auth";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Department } from "@prisma/client";

const initialState: AuthFormState = { error: null };

export function SignupForm({ departments }: { departments: Department[] }) {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <AuthCard
      title="Criar conta"
      subtitle="Plataforma de Demandas de Desenvolvimento - CSHUB"
    >
      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" type="text" name="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" name="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" name="password" required minLength={6} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="departmentId">Setor</Label>
          <select
            id="departmentId"
            name="departmentId"
            required
            defaultValue=""
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
          >
            <option value="" disabled>
              Selecione...
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} className="w-full" size="lg">
          {pending ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-accent-600 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
