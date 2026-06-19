"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canChangeStatus, isDevTeam } from "@/lib/permissions";
import { NEXT_STATUSES } from "@/lib/constants";
import type { DemandStatus, Priority } from "@prisma/client";
import { createMentionNotifications } from "@/lib/actions/notifications";

const VALID_PRIORITIES: Priority[] = ["BAIXA", "MEDIA", "ALTA", "URGENTE"];

export type DemandFormState = { error: string | null };

export async function createDemand(
  _prevState: DemandFormState,
  formData: FormData
): Promise<DemandFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priorityRaw = String(formData.get("priority") ?? "MEDIA") as Priority;
  const priority = VALID_PRIORITIES.includes(priorityRaw) ? priorityRaw : "MEDIA";
  const departmentIdRaw = String(formData.get("departmentId") ?? "").trim();

  if (!title || !description) {
    return { error: "Preencha título e descrição." };
  }

  let departmentId = user.departmentId;
  if (departmentIdRaw && departmentIdRaw !== user.departmentId) {
    const department = await prisma.department.findUnique({ where: { id: departmentIdRaw } });
    if (!department) return { error: "Setor inválido." };
    departmentId = department.id;
  }

  const isUnlimited = ["TI", "Gestão"].includes(user.department.name);
  if (!isUnlimited) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const demandsThisMonth = await prisma.demand.count({
      where: { requesterId: user.id, createdAt: { gte: startOfMonth } },
    });
    if (demandsThisMonth >= 3) {
      return { error: "Você já registrou 3 solicitações este mês. Aguarde o próximo mês para enviar outra." };
    }
  }

  const demand = await prisma.demand.create({
    data: {
      title,
      description,
      priority,
      requesterId: user!.id,
      departmentId,
    },
  });

  revalidatePath("/demandas");
  redirect(`/demandas/${demand.id}`);
}

export async function updateDemandStatus(
  demandId: string,
  newStatus: DemandStatus,
  rejectionReason?: string
) {
  const user = await getCurrentUser();
  if (!user || !canChangeStatus(user)) {
    throw new Error("Sem permissão para alterar o status desta demanda.");
  }

  const demand = await prisma.demand.findUnique({ where: { id: demandId } });
  if (!demand) throw new Error("Demanda não encontrada.");

  const allowed = NEXT_STATUSES[demand.status];
  if (!allowed.includes(newStatus)) {
    throw new Error("Transição de status inválida.");
  }

  if (newStatus === "REJEITADO" && !rejectionReason?.trim()) {
    throw new Error("Informe o motivo da rejeição.");
  }

  await prisma.demand.update({
    where: { id: demandId },
    data: {
      status: newStatus,
      rejectionReason: newStatus === "REJEITADO" ? rejectionReason!.trim() : demand.rejectionReason,
    },
  });

  revalidatePath(`/demandas/${demandId}`);
  revalidatePath("/demandas");
  revalidatePath("/demandas/arquivadas");
}

export async function updateDemandDepartment(demandId: string, departmentId: string) {
  const user = await getCurrentUser();
  if (!user || !isDevTeam(user.role)) throw new Error("Sem permissão para alterar a categoria desta demanda.");

  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) throw new Error("Setor inválido.");

  await prisma.demand.update({ where: { id: demandId }, data: { departmentId } });

  revalidatePath(`/demandas/${demandId}`);
  revalidatePath("/demandas");
  revalidatePath("/demandas/arquivadas");
  revalidatePath("/dashboard");
}

export async function updatePriority(demandId: string, priority: Priority) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!VALID_PRIORITIES.includes(priority)) throw new Error("Prioridade inválida.");

  const demand = await prisma.demand.findUnique({ where: { id: demandId } });
  if (!demand) throw new Error("Demanda não encontrada.");
  if (demand.requesterId !== user.id) throw new Error("Sem permissão.");

  await prisma.demand.update({ where: { id: demandId }, data: { priority } });
  revalidatePath(`/demandas/${demandId}`);
  revalidatePath("/demandas");
}

export async function editDemand(
  demandId: string,
  title: string,
  description: string,
  priority?: Priority
) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const demand = await prisma.demand.findUnique({ where: { id: demandId } });
  if (!demand) throw new Error("Demanda não encontrada.");
  if (demand.requesterId !== user.id) throw new Error("Sem permissão.");

  const locked: string[] = ["EM_DESENVOLVIMENTO", "EM_TESTE", "EM_PRODUCAO"];
  if (locked.includes(demand.status)) {
    throw new Error("Não é possível editar uma solicitação que já está em desenvolvimento ou produção.");
  }

  if (!title.trim() || !description.trim()) {
    throw new Error("Preencha título e descrição.");
  }

  await prisma.demand.update({
    where: { id: demandId },
    data: {
      title: title.trim(),
      description: description.trim(),
      ...(priority && VALID_PRIORITIES.includes(priority) ? { priority } : {}),
    },
  });

  revalidatePath(`/demandas/${demandId}`);
  revalidatePath("/demandas");
}

export async function deleteDemand(demandId: string, justification: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const demand = await prisma.demand.findUnique({ where: { id: demandId } });
  if (!demand) throw new Error("Demanda não encontrada.");
  if (demand.requesterId !== user.id) throw new Error("Sem permissão.");

  if (!justification.trim()) {
    throw new Error("Informe a justificativa para exclusão.");
  }

  await prisma.demand.delete({ where: { id: demandId } });

  revalidatePath("/demandas");
  redirect("/demandas");
}

export async function setDemandStatus(
  demandId: string,
  newStatus: DemandStatus,
  rejectionReason?: string
) {
  const user = await getCurrentUser();
  if (!user || !canChangeStatus(user)) {
    throw new Error("Sem permissão para alterar o status desta demanda.");
  }

  const demand = await prisma.demand.findUnique({ where: { id: demandId } });
  if (!demand) throw new Error("Demanda não encontrada.");

  if (newStatus === "REJEITADO" && !rejectionReason?.trim()) {
    throw new Error("Informe o motivo da rejeição.");
  }

  await prisma.demand.update({
    where: { id: demandId },
    data: {
      status: newStatus,
      rejectionReason: newStatus === "REJEITADO" ? rejectionReason!.trim() : demand.rejectionReason,
    },
  });

  revalidatePath(`/demandas/${demandId}`);
  revalidatePath("/demandas");
  revalidatePath("/demandas/arquivadas");
}

export async function setToProducao(demandId: string, projectUrl: string) {
  return setStatusWithProjectUrl(demandId, "EM_PRODUCAO", projectUrl);
}

export async function setToTeste(demandId: string, projectUrl: string) {
  return setStatusWithProjectUrl(demandId, "EM_TESTE", projectUrl);
}

async function setStatusWithProjectUrl(
  demandId: string,
  status: "EM_TESTE" | "EM_PRODUCAO",
  projectUrl: string
) {
  const user = await getCurrentUser();
  if (!user || !isDevTeam(user.role)) throw new Error("Sem permissão.");

  const url = projectUrl.trim();
  if (!url) throw new Error("Informe o link de acesso ao projeto.");

  await prisma.demand.update({
    where: { id: demandId },
    data: { status },
  });

  await prisma.project.upsert({
    where: { demandId },
    update: { projectUrl: url },
    create: { demandId, technicalSpec: "", technologies: "", projectUrl: url },
  });

  revalidatePath(`/demandas/${demandId}`);
  revalidatePath("/demandas");
  revalidatePath("/dashboard");
}

export async function upsertProjectUrl(demandId: string, projectUrl: string) {
  const user = await getCurrentUser();
  if (!user || !isDevTeam(user.role)) throw new Error("Sem permissão.");

  const url = projectUrl.trim();
  if (!url) throw new Error("Informe o link de acesso ao projeto.");

  await prisma.project.upsert({
    where: { demandId },
    update: { projectUrl: url },
    create: { demandId, technicalSpec: "", technologies: "", projectUrl: url },
  });

  revalidatePath(`/demandas/${demandId}`);
  revalidatePath("/demandas");
  revalidatePath("/dashboard");
}

export async function archiveDemand(demandId: string) {
  const user = await getCurrentUser();
  if (!user || !isDevTeam(user.role)) throw new Error("Sem permissão.");

  await prisma.demand.update({ where: { id: demandId }, data: { archived: true } });

  revalidatePath("/demandas");
  revalidatePath("/demandas/arquivadas");
  revalidatePath(`/demandas/${demandId}`);
}

export async function createDemandUpdate(demandId: string, content: string) {
  const user = await getCurrentUser();
  if (!user || !isDevTeam(user.role)) throw new Error("Sem permissão.");

  if (!content.trim()) throw new Error("Escreva o conteúdo da atualização.");

  const demand = await prisma.demand.findUnique({ where: { id: demandId }, select: { title: true } });

  await prisma.demandUpdate.create({
    data: { content: content.trim(), demandId, authorId: user.id },
  });

  if (demand && content.includes("@")) {
    await createMentionNotifications({
      content: content.trim(),
      fromName: user.name,
      fromId: user.id,
      demandId,
      demandTitle: demand.title,
      type: "MENTION_UPDATE",
    });
  }

  revalidatePath(`/demandas/${demandId}`);
}

export async function createUpdateComment(updateId: string, demandId: string, content: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!content.trim()) throw new Error("Escreva um comentário.");

  await prisma.updateComment.create({
    data: { content: content.trim(), updateId, authorId: user.id },
  });

  revalidatePath(`/demandas/${demandId}`);
}

export async function toggleUpdateReaction(updateId: string, demandId: string, emoji: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const existing = await prisma.updateReaction.findUnique({
    where: { updateId_authorId_emoji: { updateId, authorId: user.id, emoji } },
  });

  if (existing) {
    await prisma.updateReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.updateReaction.create({ data: { updateId, authorId: user.id, emoji } });
  }

  revalidatePath(`/demandas/${demandId}`);
}

export async function createSuggestion(demandId: string, content: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const demand = await prisma.demand.findUnique({ where: { id: demandId } });
  if (!demand) throw new Error("Solicitação não encontrada.");
  if (demand.status === "REJEITADO") throw new Error("Não é possível adicionar sugestões a uma demanda rejeitada.");

  if (!content.trim()) throw new Error("Escreva sua sugestão antes de enviar.");

  await prisma.suggestion.create({
    data: { content: content.trim(), demandId, authorId: user.id },
  });

  revalidatePath(`/demandas/${demandId}`);
}

export async function promoteCommentToSuggestion(commentId: string, demandId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { content: true, authorId: true, demandId: true },
  });
  if (!comment) throw new Error("Comentário não encontrado.");
  if (comment.authorId !== user.id && !isDevTeam(user.role)) throw new Error("Sem permissão.");

  const demand = await prisma.demand.findUnique({ where: { id: comment.demandId } });
  if (!demand) throw new Error("Solicitação não encontrada.");
  if (demand.status === "REJEITADO") throw new Error("Não é possível adicionar sugestões a uma demanda rejeitada.");

  const existing = await prisma.suggestion.findUnique({ where: { sourceCommentId: commentId } });
  if (existing) throw new Error("Este comentário já foi transformado em sugestão.");

  await prisma.suggestion.create({
    data: { content: comment.content, demandId: comment.demandId, authorId: user.id, sourceCommentId: commentId },
  });

  revalidatePath(`/demandas/${demandId}`);
}

export async function demoteToComment(commentId: string, demandId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const suggestion = await prisma.suggestion.findUnique({ where: { sourceCommentId: commentId } });
  if (!suggestion) throw new Error("Sugestão não encontrada.");
  if (suggestion.authorId !== user.id && !isDevTeam(user.role)) throw new Error("Sem permissão.");
  if (suggestion.status !== "PENDENTE") throw new Error("Não é possível desfazer uma sugestão já avaliada.");

  await prisma.suggestion.delete({ where: { id: suggestion.id } });
  revalidatePath(`/demandas/${demandId}`);
}

export async function approveSuggestion(suggestionId: string) {
  const user = await getCurrentUser();
  if (!user || !isDevTeam(user.role)) throw new Error("Sem permissão.");

  const suggestion = await prisma.suggestion.findUnique({
    where: { id: suggestionId },
    include: { demand: { select: { departmentId: true, id: true } }, author: { select: { id: true } } },
  });
  if (!suggestion) throw new Error("Sugestão não encontrada.");
  if (suggestion.status !== "PENDENTE") throw new Error("Sugestão já foi avaliada.");

  const title = suggestion.content.slice(0, 80).split("\n")[0].trim() || "Nova demanda";

  await prisma.$transaction([
    prisma.suggestion.update({ where: { id: suggestionId }, data: { status: "APROVADO" } }),
    prisma.demand.create({
      data: {
        title,
        description: suggestion.content,
        requesterId: suggestion.author.id,
        departmentId: suggestion.demand.departmentId,
      },
    }),
  ]);

  revalidatePath(`/demandas/${suggestion.demand.id}`);
  revalidatePath("/demandas");
}

export async function rejectSuggestion(suggestionId: string, reason: string) {
  const user = await getCurrentUser();
  if (!user || !isDevTeam(user.role)) throw new Error("Sem permissão.");

  if (!reason.trim()) throw new Error("Informe o motivo da rejeição.");

  const suggestion = await prisma.suggestion.findUnique({
    where: { id: suggestionId },
    include: { demand: { select: { id: true } } },
  });
  if (!suggestion) throw new Error("Sugestão não encontrada.");
  if (suggestion.status !== "PENDENTE") throw new Error("Sugestão já foi avaliada.");

  await prisma.suggestion.update({
    where: { id: suggestionId },
    data: { status: "REJEITADO", rejectionReason: reason.trim() },
  });

  revalidatePath(`/demandas/${suggestion.demand.id}`);
}

export async function upsertProjectSpec(
  demandId: string,
  technicalSpec: string,
  technologies: string
) {
  const user = await getCurrentUser();
  if (!user || !isDevTeam(user.role)) {
    throw new Error("Sem permissão para editar a especificação técnica.");
  }

  if (!technicalSpec.trim() || !technologies.trim()) {
    throw new Error("Preencha a especificação técnica e as tecnologias.");
  }

  await prisma.project.upsert({
    where: { demandId },
    update: { technicalSpec, technologies },
    create: { demandId, technicalSpec, technologies },
  });

  revalidatePath(`/demandas/${demandId}`);
}
