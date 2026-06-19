"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Trash2, CheckCheck, X } from "lucide-react";
import { markNotificationRead, markAllNotificationsRead, deleteNotification } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@prisma/client";

type Notification = {
  id: string;
  type: NotificationType;
  fromName: string;
  demandTitle: string;
  linkUrl: string;
  read: boolean;
  createdAt: Date;
};

function formatDate(date: Date) {
  const d = new Date(date);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

const TYPE_LABELS: Record<NotificationType, string> = {
  MENTION_COMMENT: "mencionou você em um comentário",
  MENTION_UPDATE: "mencionou você em uma atualização",
};

export function NotificationBell({
  notifications,
  iconOnly = false,
}: {
  notifications: Notification[];
  collapsed?: boolean;
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const unread = notifications.filter((n) => !n.read).length;

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      router.refresh();
    });
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteNotification(id);
      router.refresh();
    });
  }

  function handleClickNotification(n: Notification) {
    if (!n.read) handleMarkRead(n.id);
    setOpen(false);
    router.push(n.linkUrl);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex items-center gap-2 rounded-lg p-2 transition",
          iconOnly
            ? "text-navy-500 hover:bg-navy-100 hover:text-navy-800"
            : "text-[#84a3c9] hover:bg-[#16294a] hover:text-white",
          open && (iconOnly ? "bg-navy-100 text-navy-800" : "bg-[#16294a] text-white")
        )}
        aria-label="Notificações"
      >
        <Bell size={17} className="shrink-0" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-navy-200 bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-navy-100">
              <span className="text-sm font-semibold text-navy-900">Notificações</span>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={handleMarkAll}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-navy-500 hover:text-navy-800 hover:bg-navy-100 transition disabled:opacity-40"
                  >
                    <CheckCheck size={12} /> Marcar todas como lidas
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 text-navy-400 hover:text-navy-700 hover:bg-navy-100 transition"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto divide-y divide-navy-50">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell size={24} className="mx-auto mb-2 text-navy-300" />
                  <p className="text-sm text-navy-400">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "group flex items-start gap-3 px-4 py-3 transition cursor-pointer",
                      !n.read ? "bg-accent-50 hover:bg-accent-100/60" : "hover:bg-navy-50"
                    )}
                    onClick={() => handleClickNotification(n)}
                  >
                    {/* Unread dot */}
                    <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", !n.read ? "bg-accent-500" : "bg-transparent")} />

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-navy-700 leading-relaxed">
                        <span className="font-semibold text-navy-900">{n.fromName}</span>{" "}
                        {TYPE_LABELS[n.type]} em{" "}
                        <span className="font-medium text-accent-600">{n.demandTitle}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-navy-400">{formatDate(n.createdAt)}</p>
                    </div>

                    {/* Actions */}
                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!n.read && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleMarkRead(n.id)}
                          title="Marcar como lida"
                          className="rounded p-1 text-navy-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleDelete(n.id)}
                        title="Excluir notificação"
                        className="rounded p-1 text-navy-400 hover:text-red-500 hover:bg-red-50 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
