"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { NotificationType } from "@prisma/client";

export async function getNotifications() {
  const user = await getCurrentUser();
  if (!user) return [];
  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationRead(id: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { read: true } });
  revalidatePath("/");
}

export async function markAllNotificationsRead() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  revalidatePath("/");
}

export async function deleteNotification(id: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await prisma.notification.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/");
}

export async function createMentionNotifications({
  content,
  fromName,
  fromId,
  demandId,
  demandTitle,
  type,
}: {
  content: string;
  fromName: string;
  fromId: string;
  demandId: string;
  demandTitle: string;
  type: NotificationType;
}) {
  const allUsers = await prisma.user.findMany({ select: { id: true, name: true } });
  const linkUrl = `/demandas/${demandId}`;

  const mentioned = allUsers.filter(
    (u) => u.id !== fromId && content.includes(`@${u.name}`)
  );

  if (mentioned.length === 0) return;

  await prisma.notification.createMany({
    data: mentioned.map((u) => ({
      userId: u.id,
      type,
      fromName,
      demandId,
      demandTitle,
      linkUrl,
      read: false,
    })),
  });
}
