"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, MessageSquare, Trash2 } from "lucide-react";
import { createDemandUpdate, createUpdateComment, toggleUpdateReaction, deleteDemandUpdate } from "@/lib/actions/demands";
import { UserAvatar } from "@/components/UserAvatar";
import { MentionTextarea, renderWithMentions, type MentionUser } from "@/components/MentionTextarea";

const EMOJIS = ["👍", "❤️", "🚀", "🤔", "✅"];

type UpdateReaction = {
  id: string;
  emoji: string;
  author: { id: string };
};

type UpdateComment = {
  id: string;
  content: string;
  createdAt: Date;
  author: { name: string; avatarUrl: string | null };
};

type Update = {
  id: string;
  content: string;
  createdAt: Date;
  authorId: string;
  author: { name: string; avatarUrl: string | null };
  reactions: UpdateReaction[];
  comments: UpdateComment[];
};

export function DemandUpdatesSection({
  demandId,
  updates,
  currentUserId,
  canPost,
  isDevTeam = false,
  mentionableUsers,
}: {
  demandId: string;
  updates: Update[];
  currentUserId: string;
  canPost: boolean;
  isDevTeam?: boolean;
  mentionableUsers: MentionUser[];
}) {
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handlePost() {
    if (!content.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await createDemandUpdate(demandId, content);
        setContent("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao publicar.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-navy-700 dark:text-navy-300">
        Atualizações do time de TI
      </h3>

      {/* Post form (only for TI) */}
      {canPost && (
        <div className="rounded-xl border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900/20 p-3 space-y-2">
          <MentionTextarea
            value={content}
            onChange={setContent}
            mentionableUsers={mentionableUsers}
            placeholder="Publique uma atualização... (@ para mencionar)"
            rows={3}
            className="w-full rounded-lg border border-navy-200 dark:border-navy-700 bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-400"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="button"
            disabled={pending || !content.trim()}
            onClick={handlePost}
            className="flex items-center gap-1.5 rounded-lg bg-navy-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-700 disabled:opacity-40"
          >
            <Send size={12} />
            {pending ? "Publicando..." : "Publicar atualização"}
          </button>
        </div>
      )}

      {/* Update list */}
      {updates.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma atualização ainda.</p>
      )}

      <div className="space-y-4">
        {updates.map((upd) => (
          <UpdateCard
            key={upd.id}
            update={upd}
            demandId={demandId}
            currentUserId={currentUserId}
            isDevTeam={isDevTeam}
            mentionableUsers={mentionableUsers}
          />
        ))}
      </div>
    </div>
  );
}

function UpdateCard({
  update,
  demandId,
  currentUserId,
  isDevTeam,
  mentionableUsers,
}: {
  update: Update;
  demandId: string;
  currentUserId: string;
  isDevTeam: boolean;
  mentionableUsers: MentionUser[];
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const canDelete = update.authorId === currentUserId || isDevTeam;

  function handleDelete() {
    startTransition(async () => {
      await deleteDemandUpdate(update.id, demandId);
      router.refresh();
    });
  }

  // Group reactions
  const reactionGroups = EMOJIS.map((emoji) => ({
    emoji,
    count: update.reactions.filter((r) => r.emoji === emoji).length,
    active: update.reactions.some((r) => r.emoji === emoji && r.author.id === currentUserId),
  })).filter((g) => g.count > 0 || true);

  function handleReaction(emoji: string) {
    startTransition(async () => {
      await toggleUpdateReaction(update.id, demandId, emoji);
      router.refresh();
    });
  }

  function handleComment() {
    if (!commentText.trim()) return;
    startTransition(async () => {
      await createUpdateComment(update.id, demandId, commentText);
      setCommentText("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-card shadow-sm p-4 space-y-3">
      {/* Author + time */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <UserAvatar name={update.author.name} avatarUrl={update.author.avatarUrl} size="sm" />
          <div>
            <p className="text-xs font-semibold text-navy-800 dark:text-foreground">{update.author.name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(update.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        {canDelete && (
          <button
            type="button"
            disabled={pending}
            onClick={handleDelete}
            className="rounded p-1 text-navy-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-40"
            aria-label="Excluir atualização"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-navy-700 dark:text-navy-300">{renderWithMentions(update.content, mentionableUsers)}</p>

      {/* Reactions */}
      <div className="flex items-center gap-1 flex-wrap">
        {EMOJIS.map((emoji) => {
          const group = reactionGroups.find((g) => g.emoji === emoji)!;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => handleReaction(emoji)}
              disabled={pending}
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${
                group.active
                  ? "border-accent-400 bg-accent-50 dark:bg-accent-900/20"
                  : "border-navy-200 dark:border-navy-700 hover:border-accent-300"
              }`}
            >
              {emoji}
              {group.count > 0 && <span className="text-navy-600 dark:text-navy-400">{group.count}</span>}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1 rounded-full border border-navy-200 dark:border-navy-700 px-2 py-0.5 text-xs text-navy-500 hover:border-navy-400 transition ml-1"
        >
          <MessageSquare size={11} />
          {update.comments.length > 0 ? update.comments.length : ""}
          <span>{showComments ? "Ocultar" : "Comentar"}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="space-y-2 pt-1 border-t border-navy-100 dark:border-navy-800">
          {update.comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <UserAvatar name={c.author.name} avatarUrl={c.author.avatarUrl} size="sm" className="shrink-0 mt-0.5" />
              <div className="flex-1 rounded-lg bg-navy-50 dark:bg-navy-800/40 px-3 py-2">
                <p className="text-xs font-medium text-navy-800 dark:text-foreground">{c.author.name}</p>
                <p className="text-xs text-navy-600 dark:text-navy-300">{renderWithMentions(c.content, mentionableUsers)}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <MentionTextarea
              value={commentText}
              onChange={setCommentText}
              mentionableUsers={mentionableUsers}
              rows={1}
              placeholder="Escreva um comentário... (@ para mencionar)"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
              className="flex-1 rounded-lg border border-navy-200 dark:border-navy-700 bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 resize-none"
            />
            <button
              type="button"
              disabled={pending || !commentText.trim()}
              onClick={handleComment}
              className="rounded-lg bg-navy-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-700 disabled:opacity-40"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
