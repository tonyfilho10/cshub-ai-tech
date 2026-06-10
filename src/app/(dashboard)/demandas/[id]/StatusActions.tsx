"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDemandStatus } from "@/lib/actions/demands";
import { STATUS_LABELS } from "@/lib/constants";
import type { DemandStatus } from "@prisma/client";

export function StatusActions({
  demandId,
  nextStatuses,
}: {
  demandId: string;
  nextStatuses: DemandStatus[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();

  function handleChange(status: DemandStatus, rejectionReason?: string) {
    setError(null);
    startTransition(async () => {
      try {
        await updateDemandStatus(demandId, status, rejectionReason);
        setRejecting(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao atualizar status.");
      }
    });
  }

  if (nextStatuses.length === 0) return null;

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-navy-700">Avançar status</h3>
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((status) =>
          status === "REJEITADO" ? (
            <button
              key={status}
              type="button"
              disabled={pending}
              onClick={() => setRejecting((v) => !v)}
              className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              {STATUS_LABELS[status]}
            </button>
          ) : (
            <button
              key={status}
              type="button"
              disabled={pending}
              onClick={() => handleChange(status)}
              className="rounded-lg bg-navy-800 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-navy-700 disabled:opacity-60"
            >
              {STATUS_LABELS[status]}
            </button>
          )
        )}
      </div>

      {rejecting && (
        <div className="mt-3 space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Motivo da rejeição..."
            className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
          <button
            type="button"
            disabled={pending || !reason.trim()}
            onClick={() => handleChange("REJEITADO", reason)}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            Confirmar rejeição
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
