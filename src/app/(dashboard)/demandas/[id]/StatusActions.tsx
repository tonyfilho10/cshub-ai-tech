"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDemandStatus, setToProducao, setToTeste } from "@/lib/actions/demands";
import { STATUS_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Link2 } from "lucide-react";
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
  const [goingToProducao, setGoingToProducao] = useState(false);
  const [goingToTeste, setGoingToTeste] = useState(false);
  const [projectUrl, setProjectUrl] = useState("");
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

  function handleProducao() {
    setError(null);
    startTransition(async () => {
      try {
        await setToProducao(demandId, projectUrl);
        setGoingToProducao(false);
        setProjectUrl("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao mover para produção.");
      }
    });
  }

  function handleTeste() {
    setError(null);
    startTransition(async () => {
      try {
        await setToTeste(demandId, projectUrl);
        setGoingToTeste(false);
        setProjectUrl("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao mover para teste.");
      }
    });
  }

  if (nextStatuses.length === 0) return null;

  return (
    <Card className="p-4">
      <CardContent className="px-0">
        <h3 className="mb-3 text-sm font-semibold text-navy-700">Avançar status</h3>
        <div className="flex flex-wrap gap-2">
          {nextStatuses.map((status) =>
            status === "REJEITADO" ? (
              <Button
                key={status}
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={() => { setRejecting((v) => !v); setGoingToProducao(false); }}
              >
                {STATUS_LABELS[status]}
              </Button>
            ) : status === "EM_PRODUCAO" ? (
              <Button
                key={status}
                type="button"
                disabled={pending}
                onClick={() => { setGoingToProducao((v) => !v); setRejecting(false); setGoingToTeste(false); }}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {STATUS_LABELS[status]}
              </Button>
            ) : status === "EM_TESTE" ? (
              <Button
                key={status}
                type="button"
                disabled={pending}
                onClick={() => { setGoingToTeste((v) => !v); setRejecting(false); setGoingToProducao(false); }}
                className="bg-amber-500 text-navy-900 hover:bg-amber-400"
              >
                {STATUS_LABELS[status]}
              </Button>
            ) : (
              <Button
                key={status}
                type="button"
                disabled={pending}
                onClick={() => handleChange(status)}
                className="bg-navy-800 text-white hover:bg-navy-700"
              >
                {STATUS_LABELS[status]}
              </Button>
            )
          )}
        </div>

        {goingToProducao && (
          <div className="mt-3 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800 p-3">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
              <Link2 size={13} />
              Informe o link de acesso ao projeto
            </p>
            <Input
              type="url"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://..."
              className="text-sm"
            />
            <Button
              type="button"
              disabled={pending || !projectUrl.trim()}
              onClick={handleProducao}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {pending ? "Confirmando..." : "Confirmar e colocar em produção"}
            </Button>
          </div>
        )}

        {goingToTeste && (
          <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 p-3">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
              <Link2 size={13} />
              Informe o link de acesso ao ambiente de teste
            </p>
            <Input
              type="url"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://..."
              className="text-sm"
            />
            <Button
              type="button"
              disabled={pending || !projectUrl.trim()}
              onClick={handleTeste}
              className="bg-amber-500 text-navy-900 hover:bg-amber-400"
            >
              {pending ? "Confirmando..." : "Confirmar e colocar em teste"}
            </Button>
          </div>
        )}

        {rejecting && (
          <div className="mt-3 space-y-2">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Motivo da rejeição..."
            />
            <Button
              type="button"
              variant="destructive"
              disabled={pending || !reason.trim()}
              onClick={() => handleChange("REJEITADO", reason)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Confirmar rejeição
            </Button>
          </div>
        )}

        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
