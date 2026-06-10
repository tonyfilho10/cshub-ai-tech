"use client";

import { useActionState } from "react";
import { createUser, type SimpleFormState } from "@/lib/actions/admin";
import { ROLE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Department, UserRole } from "@prisma/client";

const ROLES: UserRole[] = ["USER", "DEV_TEAM", "ADMIN"];

const initialState: SimpleFormState = { error: null };

export function CreateUserForm({ departments }: { departments: Department[] }) {
  const [state, formAction, pending] = useActionState(createUser, initialState);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required />
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
        <Label htmlFor="role">Papel</Label>
        <Select name="role" defaultValue="USER">
          <SelectTrigger id="role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="departmentId">Setor</Label>
        <Select name="departmentId" defaultValue={departments[0]?.id}>
          <SelectTrigger id="departmentId" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {state.error && (
        <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="bg-navy-800 text-white hover:bg-navy-700 sm:col-span-2"
      >
        {pending ? "Criando..." : "Criar usuário"}
      </Button>
    </form>
  );
}
