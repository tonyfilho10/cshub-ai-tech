"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { editDemand, deleteDemand } from "@/lib/actions/demands";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/RichTextEditor";
import { PRIORITY_OPTIONS } from "@/components/PriorityBadge";
import type { Priority } from "@prisma/client";

export function ClientDemandActions({
  demandId,
  title,
  description,
  priority,
  canEdit,
}: {
  demandId: string;
  title: string;
  description: string;
  priority: Priority;
  canEdit: boolean;
}) {
  const [mode, setMode] = useState<"idle" | "edit" | "delete">("idle");
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description);
  const [editPriority, setEditPriority] = useState<Priority>(priority);
  const [justification, setJustification] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleEdit() {
    setError(null);
    startTransition(async () => {
      try {
        await editDemand(demandId, editTitle, editDescription, editPriority);
        setMode("idle");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao salvar.");
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteDemand(demandId, justification);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao excluir.");
      }
    });
  }

  if (mode === "edit") {
    return (
      <div className="space-y-3 rounded-xl border border-navy-100 bg-white dark:bg-card dark:border-navy-800 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-navy-700">Editar solicitação</h3>
        <div className="space-y-1.5">
          <Label htmlFor="edit-title">Título</Label>
          <Input
            id="edit-title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-priority">Prioridade</Label>
          <select
            id="edit-priority"
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value as Priority)}
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
            value={editDescription}
            onChange={setEditDescription}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button
            type="button"
            disabled={pending}
            onClick={handleEdit}
            className="bg-navy-800 text-white hover:bg-navy-700"
          >
            {pending ? "Salvando..." : "Salvar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => { setMode("idle"); setError(null); }}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "delete") {
    return (
      <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-red-700">Excluir solicitação</h3>
        <p className="text-sm text-red-600">
          Essa ação é irreversível. Informe o motivo da exclusão.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="justification">Justificativa</Label>
          <Textarea
            id="justification"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={3}
            placeholder="Por que deseja excluir esta solicitação?"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button
            type="button"
            disabled={pending || !justification.trim()}
            onClick={handleDelete}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {pending ? "Excluindo..." : "Confirmar exclusão"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => { setMode("idle"); setError(null); }}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {canEdit && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMode("edit")}
        >
          <Pencil size={14} />
          Editar
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setMode("delete")}
        className="border-red-200 text-red-600 hover:bg-red-50"
      >
        <Trash2 size={14} />
        Excluir
      </Button>
    </div>
  );
}
