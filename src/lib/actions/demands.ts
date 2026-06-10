"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canChangeStatus, isDevTeam } from "@/lib/permissions";
import { NEXT_STATUSES } from "@/lib/constants";
import type { DemandStatus } from "@prisma/client";

export type DemandFormState = { error: string | null };

export async function createDemand(
  _prevState: DemandFormState,
  formData: FormData
): Promise<DemandFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title || !description) {
    return { error: "Preencha título e descrição." };
  }

  const demand = await prisma.demand.create({
    data: {
      title,
      description,
      requesterId: user!.id,
      departmentId: user!.departmentId,
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
