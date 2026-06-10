"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { renameDepartment, deleteDepartment } from "@/lib/actions/admin";
import type { Department } from "@prisma/client";

export function DepartmentRow({ department }: { department: Department }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(department.name);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await renameDepartment(department.id, name);
        setEditing(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao salvar.");
      }
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteDepartment(department.id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao excluir.");
      }
    });
  }

  return (
    <li className="flex flex-col gap-1 rounded-lg border border-navy-100 bg-white px-4 py-2.5">
    <div className="flex items-center justify-between gap-3">
      {editing ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded border border-navy-200 px-2 py-1 text-sm text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500"
        />
      ) : (
        <span className="text-sm font-medium text-navy-900">{department.name}</span>
      )}

      <div className="flex items-center gap-1">
        {editing ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={save}
              className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setName(department.name);
                setEditing(false);
              }}
              className="rounded p-1.5 text-navy-400 hover:bg-navy-50"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded p-1.5 text-navy-400 hover:bg-navy-50"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={remove}
              className="rounded p-1.5 text-red-500 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </li>
  );
}
