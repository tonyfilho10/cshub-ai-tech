"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createMentionNotifications } from "@/lib/actions/notifications";

export async function updateAvatar(avatarUrl: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl },
  });

  revalidatePath("/");
}

export async function updatePassword(newPassword: string) {
  if (newPassword.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

type CommentAttachmentInput = { url: string; fileName: string; fileType: string; fileSize: number };

export async function createComment(
  demandId: string,
  content: string,
  parentId?: string,
  attachments: CommentAttachmentInput[] = []
) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!content.trim() && attachments.length === 0) {
    throw new Error("Escreva um comentário ou anexe um arquivo.");
  }

  await prisma.comment.create({
    data: {
      content: content.trim(),
      demandId,
      authorId: user.id,
      parentId: parentId ?? null,
      attachments: { create: attachments },
    },
  });

  const demand = await prisma.demand.findUnique({ where: { id: demandId }, select: { title: true } });
  if (demand && content.includes("@")) {
    await createMentionNotifications({
      content: content.trim(),
      fromName: user.name,
      fromId: user.id,
      demandId,
      demandTitle: demand.title,
      type: "MENTION_COMMENT",
    });
  }

  revalidatePath(`/demandas/${demandId}`);
}

export async function editComment(commentId: string, content: string, demandId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!content.trim()) throw new Error("Escreva um comentário.");

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("Comentário não encontrado.");
  if (comment.authorId !== user.id) throw new Error("Sem permissão.");

  await prisma.comment.update({ where: { id: commentId }, data: { content: content.trim() } });
  revalidatePath(`/demandas/${demandId}`);
}

export async function deleteComment(commentId: string, demandId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("Comentário não encontrado.");
  if (comment.authorId !== user.id) throw new Error("Sem permissão.");

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/demandas/${demandId}`);
}

export async function updateName(name: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) throw new Error("Nome deve ter pelo menos 2 caracteres.");

  await prisma.user.update({ where: { id: user.id }, data: { name: trimmed } });
  revalidatePath("/");
}

export async function toggleReaction(demandId: string, emoji: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const existing = await prisma.reaction.findUnique({
    where: { demandId_authorId_emoji: { demandId, authorId: user.id, emoji } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { demandId, authorId: user.id, emoji } });
  }

  revalidatePath(`/demandas/${demandId}`);
}
