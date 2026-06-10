import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canChangeStatus, canViewDemand, canViewProjectSpec } from "@/lib/permissions";
import { NEXT_STATUSES } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { StatusActions } from "./StatusActions";
import { ProjectSpecForm } from "./ProjectSpecForm";

export default async function DemandaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const demand = await prisma.demand.findUnique({
    where: { id },
    include: {
      requester: { select: { name: true, email: true } },
      department: { select: { name: true } },
      project: true,
    },
  });

  if (!demand) notFound();
  if (!canViewDemand(user, demand)) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card className="p-6">
        <CardContent className="px-0">
          <div className="mb-3 flex items-start justify-between gap-4">
            <h1 className="text-xl font-semibold text-navy-900">{demand.title}</h1>
            <StatusBadge status={demand.status} />
          </div>
          <p className="whitespace-pre-wrap text-sm text-navy-700">{demand.description}</p>

          <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-navy-100 pt-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Solicitante</dt>
              <dd className="font-medium text-navy-900">{demand.requester.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Setor</dt>
              <dd className="font-medium text-navy-900">{demand.department.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Criado em</dt>
              <dd className="font-medium text-navy-900">
                {demand.createdAt.toLocaleDateString("pt-BR")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Atualizado em</dt>
              <dd className="font-medium text-navy-900">
                {demand.updatedAt.toLocaleDateString("pt-BR")}
              </dd>
            </div>
          </dl>

          {demand.status === "REJEITADO" && demand.rejectionReason && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <strong>Motivo da rejeição:</strong> {demand.rejectionReason}
            </div>
          )}
        </CardContent>
      </Card>

      {canChangeStatus(user) && (
        <StatusActions demandId={demand.id} nextStatuses={NEXT_STATUSES[demand.status]} />
      )}

      {canViewProjectSpec(user) &&
        (demand.status === "APROVADO" ||
          demand.status === "EM_DESENVOLVIMENTO" ||
          demand.status === "EM_TESTE" ||
          demand.status === "EM_PRODUCAO") && (
          <ProjectSpecForm
            demandId={demand.id}
            initialSpec={demand.project?.technicalSpec ?? ""}
            initialTechnologies={demand.project?.technologies ?? ""}
          />
        )}
    </div>
  );
}
