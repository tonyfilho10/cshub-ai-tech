"use client";

import { useActionState } from "react";
import { createDepartment, type SimpleFormState } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: SimpleFormState = { error: null };

export function NewDepartmentForm() {
  const [state, formAction, pending] = useActionState(createDepartment, initialState);

  return (
    <form action={formAction} className="flex items-start gap-2">
      <div className="flex-1">
        <Input type="text" name="name" placeholder="Nome do novo setor" />
        {state.error && <p className="mt-1 text-sm text-destructive">{state.error}</p>}
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="bg-navy-800 text-white hover:bg-navy-700"
      >
        {pending ? "Adicionando..." : "Adicionar"}
      </Button>
    </form>
  );
}
