"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Trash2, Pencil, X, Check, MessageSquare, Archive, Link2, Search, Send, Lightbulb, Undo2 } from "lucide-react";
import { setDemandStatus, deleteDemand, editDemand, archiveDemand, setToProducao, setToTeste, updateDemandDepartment, promoteCommentToSuggestion, demoteToComment } from "@/lib/actions/demands";
import { toggleReaction, createComment, editComment, deleteComment } from "@/lib/actions/profile";
import { STATUS_LABELS, STATUS_BADGE_CLASSES } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge, PRIORITY_OPTIONS } from "@/components/PriorityBadge";
import { RichTextEditor } from "@/components/RichTextEditor";
import { UserAvatar } from "@/components/UserAvatar";
import { MentionTextarea, renderWithMentions, type MentionUser } from "@/components/MentionTextarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProjectUrlBanner } from "@/components/ProjectUrlBanner";
import { cn } from "@/lib/utils";
import type { DemandStatus, Priority } from "@prisma/client";

type RecentReply = {
  id: string;
  content: string;
  authorId: string;
  author: { name: string; avatarUrl: string | null };
};

type RecentComment = {
  id: string;
  content: string;
  createdAt: Date;
  authorId: string;
  author: { name: string; avatarUrl: string | null };
  replies: RecentReply[];
};

type DemandReaction = { emoji: string; author: { id: string } };

type PromotedEntry = { commentId: string; status: string };

type Demand = {
  id: string;
  title: string;
  description: string;
  status: DemandStatus;
  priority: Priority;
  createdAt: Date;
  requesterId: string;
  requester: { name: string };
  department: { id: string; name: string };
  project: { projectUrl: string | null } | null;
  commentCount: number;
  recentComments: RecentComment[];
  reactions: DemandReaction[];
  promotedCommentIds: PromotedEntry[];
};

type Department = { id: string; name: string };

const ALL_STATUSES: DemandStatus[] = [
  "SOLICITADO",
  "EM_ANALISE",
  "APROVADO",
  "REJEITADO",
  "EM_DESENVOLVIMENTO",
  "EM_TESTE",
  "EM_PRODUCAO",
];

export function DemandasList({
  demands,
  departments,
  canChangeStatus,
  userId,
  canArchive,
  isDevTeam,
  mentionableUsers,
}: {
  demands: Demand[];
  departments: Department[];
  canChangeStatus: boolean;
  userId: string;
  canArchive: boolean;
  isDevTeam: boolean;
  mentionableUsers: MentionUser[];
}) {
  const [statusFilter, setStatusFilter] = useState<DemandStatus | "TODOS">("TODOS");
  const [deptFilter, setDeptFilter] = useState<string | "TODOS">("TODOS");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "TODAS">("TODAS");
  const [search, setSearch] = useState("");

  const visible = demands.filter((d) => {
    if (statusFilter !== "TODOS" && d.status !== statusFilter) return false;
    if (deptFilter !== "TODOS" && d.department.id !== deptFilter) return false;
    if (priorityFilter !== "TODAS" && d.priority !== priorityFilter) return false;
    if (search.trim() && !d.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  const usedStatuses = Array.from(new Set(demands.map((d) => d.status)));
  const usedPriorities = Array.from(new Set(demands.map((d) => d.priority)));

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div className="relative max-w-sm">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar solicitações..."
          className="w-full rounded-lg border border-navy-200 dark:border-navy-700 bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DemandStatus | "TODOS")}
          className="rounded-lg border border-navy-200 dark:border-navy-700 bg-background px-2.5 py-1.5 text-xs text-navy-700 dark:text-navy-300 focus:outline-none focus:ring-2 focus:ring-accent-400"
        >
          <option value="TODOS">Todos os status ({demands.length})</option>
          {ALL_STATUSES.filter((s) => usedStatuses.includes(s)).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]} ({demands.filter((d) => d.status === s).length})
            </option>
          ))}
        </select>

        {usedPriorities.length > 1 && (
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as Priority | "TODAS")}
            className="rounded-lg border border-navy-200 dark:border-navy-700 bg-background px-2.5 py-1.5 text-xs text-navy-700 dark:text-navy-300 focus:outline-none focus:ring-2 focus:ring-accent-400"
          >
            <option value="TODAS">Todas as prioridades</option>
            {PRIORITY_OPTIONS.filter((o) => usedPriorities.includes(o.value)).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} ({demands.filter((d) => d.priority === o.value).length})
              </option>
            ))}
          </select>
        )}

        {departments.length > 0 && (
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-lg border border-navy-200 dark:border-navy-700 bg-background px-2.5 py-1.5 text-xs text-navy-700 dark:text-navy-300 focus:outline-none focus:ring-2 focus:ring-accent-400"
          >
            <option value="TODOS">Todos os setores</option>
            {departments.filter((dept) => demands.some((d) => d.department.id === dept.id)).map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Cards */}
      {visible.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma solicitação.</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((demand) => (
          <DemandCard
            key={demand.id}
            demand={demand}
            departments={departments}
            canChangeStatus={canChangeStatus}
            isOwner={demand.requesterId === userId}
            canArchive={canArchive}
            currentUserId={userId}
            isDevTeam={isDevTeam}
            mentionableUsers={mentionableUsers}
          />
        ))}
      </div>
    </div>
  );
}

function RecentCommentItem({
  comment,
  demandId,
  currentUserId,
  isDevTeam,
  canSuggest,
  promotedEntry,
  mentionableUsers,
}: {
  comment: RecentComment;
  demandId: string;
  currentUserId: string;
  isDevTeam: boolean;
  canSuggest: boolean;
  promotedEntry?: PromotedEntry;
  mentionableUsers: MentionUser[];
}) {
  const [showReplies, setShowReplies] = useState(false);
  return (
    <div>
      <CommentRow
        id={comment.id}
        content={comment.content}
        authorId={comment.authorId}
        authorName={comment.author.name}
        authorAvatarUrl={comment.author.avatarUrl}
        demandId={demandId}
        currentUserId={currentUserId}
        isDevTeam={isDevTeam}
        canSuggest={canSuggest}
        promotedEntry={promotedEntry}
        mentionableUsers={mentionableUsers}
      />
      {comment.replies.length > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowReplies((v) => !v); }}
          className="ml-9 mt-0.5 text-xs text-accent-600 dark:text-accent-400 hover:underline"
        >
          {showReplies ? "ocultar" : `ver ${comment.replies.length} resposta${comment.replies.length > 1 ? "s" : ""}`}
        </button>
      )}
      {showReplies && (
        <div className="mt-1.5 ml-7 space-y-1.5 border-l-2 border-navy-200 dark:border-navy-700 pl-3">
          {comment.replies.map((r) => (
            <CommentRow
              key={r.id}
              id={r.id}
              content={r.content}
              authorId={r.authorId}
              authorName={r.author.name}
              authorAvatarUrl={r.author.avatarUrl}
              demandId={demandId}
              currentUserId={currentUserId}
              mentionableUsers={mentionableUsers}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentRow({
  id,
  content,
  authorId,
  authorName,
  authorAvatarUrl,
  demandId,
  currentUserId,
  isDevTeam = false,
  canSuggest = false,
  promotedEntry,
  mentionableUsers,
}: {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  demandId: string;
  currentUserId: string;
  isDevTeam?: boolean;
  canSuggest?: boolean;
  promotedEntry?: PromotedEntry;
  mentionableUsers: MentionUser[];
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const isOwn = authorId === currentUserId;
  const canPromote = canSuggest && (isOwn || isDevTeam);
  const isPromoted = !!promotedEntry;
  const canDemote = isPromoted && promotedEntry!.status === "PENDENTE" && (isOwn || isDevTeam);

  function handleEdit() {
    if (!editContent.trim()) return;
    startTransition(async () => {
      await editComment(id, editContent, demandId);
      setEditing(false);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteComment(id, demandId);
      router.refresh();
    });
  }

  function handlePromote() {
    startTransition(async () => {
      try {
        await promoteCommentToSuggestion(id, demandId);
        router.refresh();
      } catch {}
    });
  }

  function handleDemote() {
    startTransition(async () => {
      try {
        await demoteToComment(id, demandId);
        router.refresh();
      } catch {}
    });
  }

  return (
    <div className="flex items-start gap-2" onClick={(e) => e.stopPropagation()}>
      <UserAvatar name={authorName} avatarUrl={authorAvatarUrl} size="sm" className="shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium text-navy-700 dark:text-navy-300">{authorName} </span>
        {editing ? (
          <div className="mt-1 space-y-1.5">
            <MentionTextarea
              value={editContent}
              onChange={setEditContent}
              mentionableUsers={mentionableUsers}
              rows={2}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEdit(); } }}
              className="w-full rounded-lg border border-navy-200 dark:border-navy-700 bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent-400 resize-none"
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={pending || !editContent.trim()}
                onClick={handleEdit}
                className="flex items-center gap-1 rounded-lg bg-navy-800 dark:bg-navy-700 px-2 py-1 text-xs text-white hover:bg-navy-700 disabled:opacity-40"
              >
                <Check size={11} /> Salvar
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setEditContent(content); }}
                className="flex items-center gap-1 rounded-lg border border-navy-200 dark:border-navy-700 px-2 py-1 text-xs text-navy-600 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-800"
              >
                <X size={11} /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <span className="text-xs text-navy-600 dark:text-navy-400">{renderWithMentions(content, mentionableUsers)}</span>
        )}
        {!editing && (canPromote || isPromoted) && (
          <div className="mt-1 flex items-center gap-2">
            {canPromote && !isPromoted && (
              <button
                type="button"
                disabled={pending}
                onClick={handlePromote}
                className="flex items-center gap-0.5 text-[11px] font-medium text-amber-600 hover:text-amber-700 disabled:opacity-40 transition"
              >
                <Lightbulb size={10} /> Transformar em sugestão
              </button>
            )}
            {isPromoted && promotedEntry!.status !== "PENDENTE" && (
              <span className="flex items-center gap-0.5 text-[11px] font-medium text-emerald-600">
                <Check size={10} /> Sugestão {promotedEntry!.status === "APROVADO" ? "aprovada" : "rejeitada"}
              </span>
            )}
            {canDemote && (
              <button
                type="button"
                disabled={pending}
                onClick={handleDemote}
                className="flex items-center gap-0.5 text-[11px] font-medium text-navy-400 hover:text-red-500 disabled:opacity-40 transition"
              >
                <Undo2 size={10} /> Desfazer sugestão
              </button>
            )}
          </div>
        )}
      </div>
      {isOwn && !editing && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded p-1 text-navy-400 hover:bg-navy-100 hover:text-navy-700 dark:hover:bg-navy-800 transition"
            aria-label="Editar comentário"
          >
            <Pencil size={12} />
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleDelete}
            className="rounded p-1 text-navy-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-40"
            aria-label="Excluir comentário"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}


const EMOJIS = ["👍", "❤️", "🚀", "🤔", "✅"];

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function DemandCard({
  demand,
  departments,
  canChangeStatus,
  isOwner,
  canArchive,
  currentUserId,
  isDevTeam,
  mentionableUsers,
}: {
  demand: Demand;
  departments: Department[];
  canChangeStatus: boolean;
  isOwner: boolean;
  canArchive: boolean;
  currentUserId: string;
  isDevTeam: boolean;
  mentionableUsers: MentionUser[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rejectingReason, setRejectingReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [showProducao, setShowProducao] = useState(false);
  const [showTeste, setShowTeste] = useState(false);
  const [projectUrl, setProjectUrl] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [justification, setJustification] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(demand.title);
  const [editDescription, setEditDescription] = useState(demand.description);
  const [editPriority, setEditPriority] = useState<Priority>(demand.priority);
  const [commentContent, setCommentContent] = useState("");
  const router = useRouter();

  const lockedStatuses: DemandStatus[] = ["EM_DESENVOLVIMENTO", "EM_TESTE", "EM_PRODUCAO"];
  const canEdit = isOwner && !lockedStatuses.includes(demand.status);

  const reactionGroups = EMOJIS.map((emoji) => ({
    emoji,
    count: demand.reactions.filter((r) => r.emoji === emoji).length,
    reacted: demand.reactions.some((r) => r.emoji === emoji && r.author.id === currentUserId),
  }));
  const distinctReactionEmojis = Array.from(new Set(demand.reactions.map((r) => r.emoji)));
  const reactionSummaryEmoji = distinctReactionEmojis.length === 1 ? distinctReactionEmojis[0] : "🙂";

  function handleReaction(emoji: string) {
    startTransition(async () => {
      await toggleReaction(demand.id, emoji);
      router.refresh();
    });
  }

  function handleComment() {
    setError(null);
    if (!commentContent.trim()) return;
    startTransition(async () => {
      try {
        await createComment(demand.id, commentContent);
        setCommentContent("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao comentar.");
      }
    });
  }

  function changeStatus(status: DemandStatus, reason?: string) {
    setError(null);
    startTransition(async () => {
      try {
        await setDemandStatus(demand.id, status, reason);
        setShowReject(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao atualizar status.");
      }
    });
  }

  function changeDepartment(departmentId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await updateDemandDepartment(demand.id, departmentId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao atualizar categoria.");
      }
    });
  }

  return (
    <>
    <div className="rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-card shadow-sm h-fit">
      {/* Header do card */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => { setOpen((v) => !v); setEditing(false); }}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <PriorityBadge priority={demand.priority} />
              <StatusBadge status={demand.status} />
              <span className="text-xs text-muted-foreground">
                {demand.department.name} · por {demand.requester.name}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-navy-900 dark:text-foreground line-clamp-1">{demand.title}</p>
            {demand.description && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                {stripHtml(demand.description)}
              </p>
            )}
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
                  demand.reactions.length > 0
                    ? "bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400"
                    : "bg-navy-50 dark:bg-navy-800/50 text-navy-400"
                )}
              >
                {reactionSummaryEmoji} {demand.reactions.length}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
                  demand.commentCount > 0
                    ? "bg-navy-100 dark:bg-navy-700 text-navy-600 dark:text-navy-300"
                    : "bg-navy-50 dark:bg-navy-800/50 text-navy-400"
                )}
              >
                <MessageSquare size={11} />
                {demand.commentCount}
              </span>
            </div>
          </div>
          {open ? (
            <ChevronUp size={16} className="shrink-0 text-navy-400" />
          ) : (
            <ChevronDown size={16} className="shrink-0 text-navy-400" />
          )}
        </button>
        {canEdit && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(true); setEditing((v) => !v); setError(null); }}
            className={cn(
              "shrink-0 rounded-lg p-1.5 transition",
              editing
                ? "bg-accent-100 text-accent-600"
                : "text-navy-400 hover:bg-navy-100 hover:text-navy-700"
            )}
            aria-label="Editar"
          >
            <Pencil size={14} />
          </button>
        )}
        {canArchive && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              startTransition(async () => {
                try { await archiveDemand(demand.id); router.refresh(); }
                catch (e) { setError(e instanceof Error ? e.message : "Erro ao arquivar."); }
              });
            }}
            disabled={pending}
            title="Arquivar solicitação"
            className="shrink-0 rounded-lg p-1.5 text-navy-400 hover:bg-navy-100 hover:text-navy-700 transition disabled:opacity-40"
          >
            <Archive size={14} />
          </button>
        )}
      </div>
    </div>

    {/* Modal de detalhes */}
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(false); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 flex-wrap pr-6">
            <PriorityBadge priority={demand.priority} />
            <StatusBadge status={demand.status} />
            <span className="text-xs text-muted-foreground">
              {demand.department.name} · por {demand.requester.name}
            </span>
          </div>
          <h2 className="text-base font-semibold text-navy-900 dark:text-foreground pr-6">{demand.title}</h2>
          {editing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-navy-200 dark:border-navy-700 bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-400"
              />
              <div className="space-y-1">
                <label className="text-xs font-medium text-navy-500">Prioridade</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as Priority)}
                  className="w-full rounded-lg border border-navy-200 dark:border-navy-700 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
                >
                  {PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <RichTextEditor
                value={editDescription}
                onChange={setEditDescription}
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      try {
                        await editDemand(demand.id, editTitle, editDescription, editPriority);
                        setEditing(false);
                        router.refresh();
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "Erro ao salvar.");
                      }
                    });
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-navy-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-700 disabled:opacity-40"
                >
                  <Check size={13} />
                  {pending ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setEditTitle(demand.title); setEditDescription(demand.description); setError(null); }}
                  className="flex items-center gap-1.5 rounded-lg border border-navy-200 dark:border-navy-700 px-3 py-1.5 text-xs text-navy-600 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-800"
                >
                  <X size={13} />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div
              className="tiptap-prose"
              dangerouslySetInnerHTML={{ __html: demand.description }}
            />
          )}

          {!editing && (
            <ProjectUrlBanner
              demandId={demand.id}
              projectUrl={demand.project?.projectUrl ?? null}
              status={demand.status}
              isDevTeam={isDevTeam}
            />
          )}

          {!editing && (
            <>
              {/* Reações */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground">Reagir:</span>
                {reactionGroups.map(({ emoji, count, reacted }) => (
                  <button
                    key={emoji}
                    type="button"
                    disabled={pending}
                    onClick={() => handleReaction(emoji)}
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm transition-all",
                      reacted
                        ? "border-accent-400 bg-accent-400/10 dark:bg-accent-400/15 scale-105"
                        : "border-navy-100 dark:border-navy-700 hover:border-accent-300 hover:bg-navy-50 dark:hover:bg-navy-800/60"
                    )}
                  >
                    <span>{emoji}</span>
                    {count > 0 && (
                      <span className={cn("text-xs font-medium", reacted ? "text-accent-600 dark:text-accent-300" : "text-navy-500 dark:text-navy-400")}>
                        {count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Comentários recentes */}
              <div className="space-y-2 rounded-lg border border-navy-100 dark:border-navy-800 bg-navy-50 dark:bg-navy-900/30 p-3">
                <p className="text-xs font-semibold text-navy-400 uppercase tracking-wide flex items-center gap-1">
                  <MessageSquare size={11} />
                  Comentários {demand.commentCount > 0 && `(${demand.commentCount})`}
                </p>
                {demand.recentComments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum comentário ainda. Seja o primeiro!</p>
                ) : (
                  demand.recentComments.map((c) => (
                    <RecentCommentItem
                      key={c.id}
                      comment={c}
                      demandId={demand.id}
                      currentUserId={currentUserId}
                      isDevTeam={isDevTeam}
                      canSuggest={demand.status !== "REJEITADO"}
                      promotedEntry={demand.promotedCommentIds.find((p) => p.commentId === c.id)}
                      mentionableUsers={mentionableUsers}
                    />
                  ))
                )}
              </div>

              {/* Composer de comentário */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <MentionTextarea
                    value={commentContent}
                    onChange={setCommentContent}
                    mentionableUsers={mentionableUsers}
                    rows={2}
                    placeholder="Escreva um comentário... (@ para mencionar)"
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                    className="w-full rounded-xl border border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-800/30 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400/60 focus:border-accent-400 resize-none transition"
                  />
                </div>
                <button
                  type="button"
                  disabled={pending || !commentContent.trim()}
                  onClick={handleComment}
                  className="shrink-0 rounded-xl bg-navy-800 dark:bg-navy-700 p-2.5 text-white hover:bg-navy-700 dark:hover:bg-navy-600 disabled:opacity-40 transition"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <Link
              href={`/demandas/${demand.id}`}
              className="text-xs text-accent-600 hover:underline"
            >
              Ver detalhes completos →
            </Link>

            {isOwner && (
              <button
                type="button"
                onClick={() => { setShowDelete((v) => !v); setError(null); }}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
              >
                <Trash2 size={13} />
                Excluir
              </button>
            )}
          </div>

          {showDelete && (
            <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs text-red-600 font-medium">Informe o motivo da exclusão:</p>
              <input
                type="text"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Justificativa..."
                className="w-full rounded-lg border border-red-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending || !justification.trim()}
                  onClick={() => {
                    startTransition(async () => {
                      try { await deleteDemand(demand.id, justification); router.refresh(); }
                      catch (e) { setError(e instanceof Error ? e.message : "Erro ao excluir."); }
                    });
                  }}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-40"
                >
                  {pending ? "Excluindo..." : "Confirmar"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDelete(false); setJustification(""); setError(null); }}
                  className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs text-navy-600 hover:bg-navy-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {canChangeStatus && departments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-navy-500 uppercase tracking-wide">
                Categoria
              </p>
              <Select
                value={demand.department.id}
                disabled={pending}
                onValueChange={(value) => { if (value) changeDepartment(value); }}
              >
                <SelectTrigger size="sm" className="w-full sm:w-56">
                  <SelectValue>
                    {departments.find((d) => d.id === demand.department.id)?.name ?? demand.department.name}
                  </SelectValue>
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
          )}

          {canChangeStatus && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-navy-500 uppercase tracking-wide">
                Alterar status
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map((s) =>
                  s === "REJEITADO" ? (
                    <button
                      key={s}
                      type="button"
                      disabled={pending || demand.status === s}
                      onClick={() => { setShowReject((v) => !v); setShowProducao(false); }}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition",
                        demand.status === s
                          ? "opacity-40 cursor-default border-red-300 bg-red-50 text-red-700"
                          : "border-red-300 text-red-600 hover:bg-red-50"
                      )}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ) : s === "EM_PRODUCAO" ? (
                    <button
                      key={s}
                      type="button"
                      disabled={pending || demand.status === s}
                      onClick={() => { setShowProducao((v) => !v); setShowReject(false); setShowTeste(false); }}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition",
                        demand.status === s
                          ? "opacity-40 cursor-default border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                      )}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ) : s === "EM_TESTE" ? (
                    <button
                      key={s}
                      type="button"
                      disabled={pending || demand.status === s}
                      onClick={() => { setShowTeste((v) => !v); setShowReject(false); setShowProducao(false); }}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition",
                        demand.status === s
                          ? "opacity-40 cursor-default border-amber-300 bg-amber-50 text-amber-700"
                          : "border-amber-300 text-amber-600 hover:bg-amber-50"
                      )}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ) : (
                    <button
                      key={s}
                      type="button"
                      disabled={pending || demand.status === s}
                      onClick={() => changeStatus(s)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition",
                        demand.status === s
                          ? "opacity-40 cursor-default " + STATUS_BADGE_CLASSES[s]
                          : "border-navy-200 text-navy-600 hover:border-accent-300 hover:bg-accent-50"
                      )}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  )
                )}
              </div>

              {showReject && (
                <div className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={rejectingReason}
                    onChange={(e) => setRejectingReason(e.target.value)}
                    placeholder="Motivo da rejeição..."
                    className="flex-1 rounded-lg border border-navy-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
                  />
                  <button
                    type="button"
                    disabled={pending || !rejectingReason.trim()}
                    onClick={() => changeStatus("REJEITADO", rejectingReason)}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-40"
                  >
                    Confirmar
                  </button>
                </div>
              )}

              {showProducao && (
                <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800 p-3">
                  <p className="text-xs font-medium text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                    <Link2 size={12} />
                    Informe o link de acesso ao projeto
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={projectUrl}
                      onChange={(e) => setProjectUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <button
                      type="button"
                      disabled={pending || !projectUrl.trim()}
                      onClick={() => {
                        setError(null);
                        startTransition(async () => {
                          try {
                            await setToProducao(demand.id, projectUrl);
                            setShowProducao(false);
                            setProjectUrl("");
                            router.refresh();
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Erro ao mover para produção.");
                          }
                        });
                      }}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}

              {showTeste && (
                <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 p-3">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                    <Link2 size={12} />
                    Informe o link de acesso ao ambiente de teste
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={projectUrl}
                      onChange={(e) => setProjectUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 rounded-lg border border-amber-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      disabled={pending || !projectUrl.trim()}
                      onClick={() => {
                        setError(null);
                        startTransition(async () => {
                          try {
                            await setToTeste(demand.id, projectUrl);
                            setShowTeste(false);
                            setProjectUrl("");
                            router.refresh();
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Erro ao mover para teste.");
                          }
                        });
                      }}
                      className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-navy-900 hover:bg-amber-400 disabled:opacity-40"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
