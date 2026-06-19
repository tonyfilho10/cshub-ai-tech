"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Check, X, CheckCircle, XCircle, Clock } from "lucide-react";
import { createSuggestion, approveSuggestion, rejectSuggestion } from "@/lib/actions/demands";
import type { SuggestionStatus } from "@prisma/client";

type Suggestion = {
  id: string;
  content: string;
  status: SuggestionStatus;
  rejectionReason: string | null;
  createdAt: Date;
  author: { name: string };
};

const STATUS_CONFIG = {
  PENDENTE:  { label: "Pendente",  icon: Clock,        className: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" },
  APROVADO:  { label: "Aprovado",  icon: CheckCircle,  className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" },
  REJEITADO: { label: "Rejeitado", icon: XCircle,      className: "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
};

export function SuggestionsSection({
  demandId,
  suggestions,
  canApprove,
}: {
  demandId: string;
  suggestions: Suggestion[];
  canApprove: boolean;
}) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await createSuggestion(demandId, content);
        setContent("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao enviar sugestão.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-card p-5 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-navy-700 dark:text-navy-300">Sugestões</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Sugestões aprovadas geram uma nova solicitação de desenvolvimento.
        </p>
      </div>

      {suggestions.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma sugestão ainda.</p>
      )}

      <div className="space-y-3">
        {suggestions.map((s) => (
          <SuggestionCard key={s.id} suggestion={s} canApprove={canApprove} />
        ))}
      </div>

      <div className="space-y-2 pt-2 border-t border-navy-100 dark:border-navy-800">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Deixe sua sugestão de melhoria..."
          onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSubmit(); }}
          className="w-full rounded-lg border border-navy-200 dark:border-navy-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 resize-none"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="button"
          disabled={pending || !content.trim()}
          onClick={handleSubmit}
          className="flex items-center gap-2 rounded-lg bg-navy-800 px-4 py-2 text-sm font-medium text-white hover:bg-navy-700 disabled:opacity-40"
        >
          <Send size={14} />
          {pending ? "Enviando..." : "Enviar sugestão"}
        </button>
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  canApprove,
}: {
  suggestion: Suggestion;
  canApprove: boolean;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { label, icon: Icon, className } = STATUS_CONFIG[suggestion.status];

  function handleApprove() {
    startTransition(async () => {
      await approveSuggestion(suggestion.id);
      router.refresh();
    });
  }

  function handleReject() {
    if (!reason.trim()) return;
    startTransition(async () => {
      await rejectSuggestion(suggestion.id, reason);
      setRejecting(false);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-navy-100 dark:border-navy-800 bg-navy-50 dark:bg-navy-900/30 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-navy-800 dark:text-foreground whitespace-pre-wrap flex-1">{suggestion.content}</p>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium shrink-0 ${className}`}>
          <Icon size={11} />
          {label}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        {suggestion.author.name} · {new Date(suggestion.createdAt).toLocaleDateString("pt-BR")}
      </p>

      {suggestion.status === "REJEITADO" && suggestion.rejectionReason && (
        <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2">
          <p className="text-xs text-red-700 dark:text-red-400">
            <span className="font-medium">Motivo da rejeição:</span> {suggestion.rejectionReason}
          </p>
        </div>
      )}

      {suggestion.status === "APROVADO" && (
        <div className="rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2">
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            ✓ Uma nova solicitação foi criada a partir desta sugestão.
          </p>
        </div>
      )}

      {canApprove && suggestion.status === "PENDENTE" && (
        <div className="space-y-2">
          {!rejecting ? (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={handleApprove}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
              >
                <Check size={12} /> Aprovar
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setRejecting(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-300 dark:border-red-700 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40"
              >
                <X size={12} /> Rejeitar
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                autoFocus
                placeholder="Informe o motivo da rejeição..."
                className="w-full rounded-lg border border-red-200 dark:border-red-700 bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending || !reason.trim()}
                  onClick={handleReject}
                  className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-40"
                >
                  <Check size={11} /> Confirmar rejeição
                </button>
                <button
                  type="button"
                  onClick={() => { setRejecting(false); setReason(""); }}
                  className="rounded-lg border border-navy-200 dark:border-navy-700 px-3 py-1.5 text-xs text-navy-600 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-800"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
