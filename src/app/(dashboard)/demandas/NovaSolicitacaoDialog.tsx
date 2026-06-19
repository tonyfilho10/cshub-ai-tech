"use client";

import { useActionState, useState } from "react";
import { PlusCircle } from "lucide-react";
import { createDemand, type DemandFormState } from "@/lib/actions/demands";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/RichTextEditor";
import { PRIORITY_OPTIONS } from "@/components/PriorityBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

const initialState: DemandFormState = { error: null };

export function NovaSolicitacaoDialog() {
  const [state, formAction, pending] = useActionState(createDemand, initialState);
  const [description, setDescription] = useState("");

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button className="bg-accent-400 text-navy-900 hover:bg-accent-500">
            <PlusCircle size={16} />
            Nova solicitação
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova solicitação</DialogTitle>
          <DialogDescription>
            Descreva a necessidade do seu setor. O time de desenvolvimento irá
            analisar e retornar com um parecer.
          </DialogDescription>
        </DialogHeader>

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
            <Label htmlFor="priority">Prioridade</Label>
            <select
              id="priority"
              name="priority"
              defaultValue="MEDIA"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
            />
            <input type="hidden" name="description" value={description} />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={pending} className="w-full" size="lg">
            {pending ? "Enviando..." : "Enviar solicitação"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
