"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Pencil, Trash2, CornerDownRight, Check, X, Lightbulb, Undo2 } from "lucide-react";
import { createComment, editComment, deleteComment, toggleReaction } from "@/lib/actions/profile";
import { promoteCommentToSuggestion, demoteToComment } from "@/lib/actions/demands";
import { UserAvatar } from "@/components/UserAvatar";
import { MentionTextarea, renderWithMentions, type MentionUser } from "@/components/MentionTextarea";
import { cn } from "@/lib/utils";
import type { DemandStatus } from "@prisma/client";

type Author = { id: string; name: string; avatarUrl: string | null };

type Reply = {
  id: string;
  content: string;
  createdAt: Date;
  authorId: string;
  author: Author;
};

type Comment = {
  id: string;
  content: string;
  createdAt: Date;
  authorId: string;
  author: Author;
  replies: Reply[];
};

type Reaction = {
  id: string;
  emoji: string;
  author: { id: string };
};

const EMOJIS = ["👍", "❤️", "🚀", "🤔", "✅"];
const BLOCKED_STATUSES: DemandStatus[] = ["REJEITADO"];

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

type PromotedEntry = { commentId: string; status: string };

export function CommentsSection({
  demandId,
  demandStatus,
  comments,
  reactions,
  currentUserId,
  mentionableUsers,
  isDevTeam,
  promotedCommentIds = [],
}: {
  demandId: string;
  demandStatus: DemandStatus;
  comments: Comment[];
  reactions: Reaction[];
  currentUserId: string;
  mentionableUsers: MentionUser[];
  isDevTeam: boolean;
  promotedCommentIds?: PromotedEntry[];
}) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleComment() {
    setError(null);
    if (!content.trim()) return;
    startTransition(async () => {
      try {
        await createComment(demandId, content);
        setContent("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao comentar.");
      }
    });
  }

  function handleReaction(emoji: string) {
    startTransition(async () => {
      await toggleReaction(demandId, emoji);
      router.refresh();
    });
  }

  const reactionCounts = EMOJIS.map((emoji) => {
    const group = reactions.filter((r) => r.emoji === emoji);
    return { emoji, count: group.length, reacted: group.some((r) => r.author.id === currentUserId) };
  });

  const canSuggest = !BLOCKED_STATUSES.includes(demandStatus);
  const totalReplies = comments.reduce((s, c) => s + c.replies.length, 0);

  return (
    <div className="rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-card shadow-sm overflow-hidden">
      {/* Reactions bar */}
      <div className="px-5 py-3 border-b border-navy-50 dark:border-navy-800/60 flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground mr-1">Reagir:</span>
        {reactionCounts.map(({ emoji, count, reacted }) => (
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

      {/* Comments section */}
      <div className="p-5 space-y-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-navy-700 dark:text-navy-300">
            Comentários
            {comments.length + totalReplies > 0 && (
              <span className="ml-1.5 rounded-full bg-navy-100 dark:bg-navy-800 px-1.5 py-0.5 text-xs text-navy-500 dark:text-navy-400">
                {comments.length + totalReplies}
              </span>
            )}
          </h3>
        </div>

        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground py-2 mb-3">Nenhum comentário ainda. Seja o primeiro!</p>
        )}

        <div className="space-y-5">
          {comments.map((c) => {
            const promoted = promotedCommentIds.find((p) => p.commentId === c.id);
            return (
              <CommentItem
                key={c.id}
                comment={c}
                demandId={demandId}
                currentUserId={currentUserId}
                mentionableUsers={mentionableUsers}
                canSuggest={canSuggest}
                isDevTeam={isDevTeam}
                promotedEntry={promoted}
              />
            );
          })}
        </div>

        {/* New comment input */}
        <div className="mt-5 flex gap-3 items-end pt-4 border-t border-navy-50 dark:border-navy-800/60">
          <div className="flex-1 space-y-2">
            <MentionTextarea
              value={content}
              onChange={setContent}
              mentionableUsers={mentionableUsers}
              rows={2}
              placeholder="Escreva um comentário... (@ para mencionar)"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
              className="w-full rounded-xl border border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-800/30 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400/60 focus:border-accent-400 resize-none transition"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <button
            type="button"
            disabled={pending || !content.trim()}
            onClick={handleComment}
            className="shrink-0 rounded-xl bg-navy-800 dark:bg-navy-700 p-2.5 text-white hover:bg-navy-700 dark:hover:bg-navy-600 disabled:opacity-40 transition mb-0.5"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  demandId,
  currentUserId,
  mentionableUsers,
  canSuggest,
  isDevTeam,
  isReply = false,
  promotedEntry,
}: {
  comment: Comment | Reply;
  demandId: string;
  currentUserId: string;
  mentionableUsers: MentionUser[];
  canSuggest: boolean;
  isDevTeam: boolean;
  isReply?: boolean;
  promotedEntry?: PromotedEntry;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const isOwn = comment.authorId === currentUserId;
  const replies = "replies" in comment ? comment.replies : [];
  const canPromote = canSuggest && !isReply && (isOwn || isDevTeam);
  const isPromoted = !!promotedEntry;
  const canDemote = isPromoted && promotedEntry!.status === "PENDENTE" && (isOwn || isDevTeam);

  function handleEdit() {
    if (!editContent.trim()) return;
    startTransition(async () => {
      await editComment(comment.id, editContent, demandId);
      setEditing(false);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteComment(comment.id, demandId);
      router.refresh();
    });
  }

  function handleReply() {
    if (!replyContent.trim()) return;
    startTransition(async () => {
      await createComment(demandId, replyContent, comment.id);
      setReplyContent("");
      setReplying(false);
      router.refresh();
    });
  }

  function handlePromote() {
    startTransition(async () => {
      try {
        await promoteCommentToSuggestion(comment.id, demandId);
        router.refresh();
      } catch {}
    });
  }

  function handleDemote() {
    startTransition(async () => {
      try {
        await demoteToComment(comment.id, demandId);
        router.refresh();
      } catch {}
    });
  }

  return (
    <div className="flex gap-3">
      <UserAvatar name={comment.author.name} avatarUrl={comment.author.avatarUrl} size="sm" className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        {/* Bubble */}
        <div className={cn(
          "rounded-2xl rounded-tl-sm px-4 py-2.5",
          isOwn
            ? "bg-navy-800 dark:bg-navy-700 text-white"
            : "bg-navy-50 dark:bg-navy-800/50"
        )}>
          <p className={cn("text-xs font-semibold mb-0.5", isOwn ? "text-navy-200" : "text-navy-500 dark:text-navy-400")}>
            {comment.author.name}
          </p>
          {editing ? (
            <div className="space-y-1.5">
              <MentionTextarea
                value={editContent}
                onChange={setEditContent}
                mentionableUsers={mentionableUsers}
                rows={2}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEdit(); } }}
                className="w-full rounded-lg border border-navy-600 bg-navy-900/50 px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-400 resize-none"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={pending || !editContent.trim()}
                  onClick={handleEdit}
                  className="flex items-center gap-1 rounded-lg bg-accent-500 px-2.5 py-1 text-xs font-medium text-navy-900 hover:bg-accent-400 disabled:opacity-40"
                >
                  <Check size={11} /> Salvar
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setEditContent(comment.content); }}
                  className="flex items-center gap-1 rounded-lg bg-navy-600 px-2.5 py-1 text-xs text-white hover:bg-navy-500"
                >
                  <X size={11} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className={cn("text-sm leading-relaxed", isOwn ? "text-white" : "text-navy-800 dark:text-foreground/90")}>
              {renderWithMentions(comment.content, mentionableUsers)}
            </p>
          )}
        </div>

        {/* Meta row */}
        <div className="mt-1 flex items-center gap-3 pl-1 flex-wrap">
          <span className="text-[11px] text-muted-foreground">{formatDate(comment.createdAt)}</span>
          {"replies" in comment && (
            <button
              type="button"
              onClick={() => setReplying((v) => !v)}
              className="text-[11px] font-medium text-navy-500 hover:text-accent-600 dark:hover:text-accent-400 flex items-center gap-0.5 transition"
            >
              <CornerDownRight size={11} /> Responder
            </button>
          )}
          {isOwn && !editing && (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-[11px] text-navy-400 hover:text-navy-700 dark:hover:text-foreground flex items-center gap-0.5 transition"
              >
                <Pencil size={10} /> Editar
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleDelete}
                className="text-[11px] text-red-400 hover:text-red-500 flex items-center gap-0.5 disabled:opacity-40 transition"
              >
                <Trash2 size={10} /> Excluir
              </button>
            </>
          )}
          {canPromote && !isPromoted && (
            <button
              type="button"
              disabled={pending}
              onClick={handlePromote}
              className="text-[11px] font-medium text-amber-600 hover:text-amber-700 flex items-center gap-0.5 disabled:opacity-40 transition"
            >
              <Lightbulb size={10} /> Transformar em sugestão
            </button>
          )}
          {isPromoted && promotedEntry!.status !== "PENDENTE" && (
            <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-0.5">
              <Check size={10} /> Sugestão {promotedEntry!.status === "APROVADO" ? "aprovada" : "rejeitada"}
            </span>
          )}
          {canDemote && (
            <button
              type="button"
              disabled={pending}
              onClick={handleDemote}
              className="text-[11px] font-medium text-navy-400 hover:text-red-500 flex items-center gap-0.5 disabled:opacity-40 transition"
            >
              <Undo2 size={10} /> Desfazer sugestão
            </button>
          )}
        </div>

        {/* Reply input */}
        {replying && (
          <div className="mt-2 flex gap-2">
            <MentionTextarea
              value={replyContent}
              onChange={setReplyContent}
              mentionableUsers={mentionableUsers}
              rows={1}
              autoFocus
              placeholder={`Responder ${comment.author.name}...`}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
              className="flex-1 rounded-xl border border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-800/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400/60 resize-none transition"
            />
            <button
              type="button"
              disabled={pending || !replyContent.trim()}
              onClick={handleReply}
              className="self-start rounded-xl bg-navy-800 dark:bg-navy-700 p-2 text-white hover:bg-navy-700 disabled:opacity-40"
            >
              <Send size={13} />
            </button>
          </div>
        )}

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mt-3 space-y-3 border-l-2 border-navy-100 dark:border-navy-700/60 pl-3">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                demandId={demandId}
                currentUserId={currentUserId}
                mentionableUsers={mentionableUsers}
                canSuggest={false}
                isDevTeam={isDevTeam}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
