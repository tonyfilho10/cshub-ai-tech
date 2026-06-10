"use client";

import { useActionState } from "react";
import { createDemand, type DemandFormState } from "@/lib/actions/demands";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: DemandFormState = { error: null };

export default function NovaDemandaPage() {
  const [state, formAction, pending] = useActionState(createDemand, initialState);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold text-navy-900">Nova Demanda</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Descreva a necessidade do seu setor. O time de desenvolvimento irá analisar
        e retornar com um parecer.
      </p>

      <Card className="p-6">
        <CardContent className="px-0">
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                type="text"
                name="title"
                required
                placeholder="Ex: Sistema de controle de estoque"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                required
                rows={6}
                placeholder="Descreva o problema, o objetivo e o impacto esperado..."
              />
            </div>

            {state.error && <p className="text-sm text-destructive">{state.error}</p>}

            <Button type="submit" disabled={pending} size="lg">
              {pending ? "Enviando..." : "Enviar demanda"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
