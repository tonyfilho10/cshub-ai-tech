import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canChangeStatus, canViewDemand, canViewProjectSpec, isDevTeam } from "@/lib/permissions";
import { NEXT_STATUSES } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { PrioritySelector } from "./PrioritySelector";
import { Card, CardContent } from "@/components/ui/card";
import { StatusActions } from "./StatusActions";
import { ProjectSpecForm } from "./ProjectSpecForm";
import { ClientDemandActions } from "./ClientDemandActions";
import { SuggestionsSection } from "./SuggestionsSection";
import { CommentsSection } from "./CommentsSection";
import { DemandUpdatesSection } from "./DemandUpdatesSection";

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
      suggestions: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      comments: {
        where: { parentId: null },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          replies: {
            include: { author: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      reactions: {
        include: { author: { select: { id: true } } },
      },
      updates: {
        include: {
          author: { select: { name: true, avatarUrl: true } },
          reactions: { include: { author: { select: { id: true } } } },
          comments: {
            include: { author: { select: { name: true, avatarUrl: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!demand) notFound();
  if (!canViewDemand(user, demand)) notFound();

  const mentionableUsers = isDevTeam(user.role)
    ? await prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
    : await prisma.user.findMany({
        where: {
          OR: [
            { departmentId: demand.departmentId },
            { department: { name: { in: ["TI", "Gestão"] } } },
          ],
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });

  const isRequester = demand.requesterId === user.id;
  const lockedStatuses = ["EM_DESENVOLVIMENTO", "EM_TESTE", "EM_PRODUCAO"];
  const canEdit = !lockedStatuses.includes(demand.status);
  const canPost = isDevTeam(user.role);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card className="p-6">
        <CardContent className="px-0">
          <div className="mb-3 flex items-start justify-between gap-4">
            <h1 className="text-xl font-semibold text-navy-900">{demand.title}</h1>
            <div className="flex items-center gap-2 shrink-0">
              {isRequester && canEdit ? (
                <PrioritySelector demandId={demand.id} priority={demand.priority} />
              ) : (
                <PriorityBadge priority={demand.priority} />
              )}
              <StatusBadge status={demand.status} />
            </div>
          </div>
          <div
            className="tiptap-prose"
            dangerouslySetInnerHTML={{ __html: demand.description }}
          />

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

      {isRequester && (
        <ClientDemandActions
          demandId={demand.id}
          title={demand.title}
          description={demand.description}
          priority={demand.priority}
          canEdit={canEdit}
        />
      )}

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

      {/* TI Updates */}
      <Card className="p-5">
        <CardContent className="px-0">
          <DemandUpdatesSection
            demandId={demand.id}
            updates={demand.updates}
            currentUserId={user.id}
            canPost={canPost}
            mentionableUsers={mentionableUsers}
          />
        </CardContent>
      </Card>

      <CommentsSection
        demandId={demand.id}
        demandStatus={demand.status}
        comments={demand.comments}
        reactions={demand.reactions}
        currentUserId={user.id}
        mentionableUsers={mentionableUsers}
        isDevTeam={isDevTeam(user.role)}
        promotedCommentIds={demand.suggestions
          .filter((s) => s.sourceCommentId !== null)
          .map((s) => ({ commentId: s.sourceCommentId!, status: s.status }))}
      />

      {demand.status !== "REJEITADO" && (
        <SuggestionsSection
          demandId={demand.id}
          suggestions={demand.suggestions}
          canApprove={isDevTeam(user.role)}
        />
      )}
    </div>
  );
}
