import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canChangeStatus, canViewDemand, canViewProjectSpec, isDevTeam, SHARED_DEPARTMENT_NAME } from "@/lib/permissions";
import { NEXT_STATUSES } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { ProjectUrlBanner } from "@/components/ProjectUrlBanner";
import { AttachmentGallery } from "@/components/AttachmentUploader";
import { cn } from "@/lib/utils";
import { PrioritySelector } from "./PrioritySelector";
import { Card, CardContent } from "@/components/ui/card";
import { StatusActions } from "./StatusActions";
import { ProjectSpecForm } from "./ProjectSpecForm";
import { ClientDemandActions } from "./ClientDemandActions";
import { SuggestionsSection } from "./SuggestionsSection";
import { CommentsSection } from "./CommentsSection";
import { DemandUpdatesSection } from "./DemandUpdatesSection";
import { PageOutline } from "./PageOutline";

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
      attachments: true,
      priorityLogs: {
        include: { changedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      comments: {
        where: { parentId: null },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          attachments: true,
          replies: {
            include: {
              author: { select: { id: true, name: true, avatarUrl: true } },
              attachments: true,
            },
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

  const isSharedDemand = demand.department.name === SHARED_DEPARTMENT_NAME;
  const mentionableUsers = isDevTeam(user.role) || isSharedDemand
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
  const canEdit = isDevTeam(user.role) || (isRequester && !lockedStatuses.includes(demand.status));
  const canPost = isDevTeam(user.role);

  const showProjectSpec =
    canViewProjectSpec(user) &&
    (demand.status === "APROVADO" ||
      demand.status === "EM_DESENVOLVIMENTO" ||
      demand.status === "EM_TESTE" ||
      demand.status === "EM_PRODUCAO");
  const showSuggestions = demand.status !== "REJEITADO";

  const outlineSections = [
    { id: "detalhes", label: "Detalhes da solicitação" },
    ...(showProjectSpec ? [{ id: "especificacao", label: "Especificação técnica" }] : []),
    { id: "atualizacoes", label: "Atualizações do time de TI" },
    { id: "comentarios", label: "Comentários" },
    ...(showSuggestions ? [{ id: "sugestoes", label: "Sugestões" }] : []),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageOutline sections={outlineSections} />
      <Card id="detalhes" className="p-6">
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

          {demand.attachments.length > 0 && (
            <div className="mt-3">
              <AttachmentGallery attachments={demand.attachments} canDelete={isRequester || isDevTeam(user.role)} />
            </div>
          )}

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
            {demand.deadline && (
              <div>
                <dt className="text-muted-foreground">Prazo de conclusão</dt>
                <dd className={cn("font-medium", new Date(demand.deadline) < new Date() ? "text-red-600" : "text-navy-900")}>
                  {demand.deadline.toLocaleDateString("pt-BR")}
                </dd>
              </div>
            )}
          </dl>

          {demand.priorityLogs.length > 0 && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-navy-700">
                Histórico de prioridade ({demand.priorityLogs.length})
              </summary>
              <ul className="mt-2 space-y-1.5 border-l-2 border-navy-100 pl-3">
                {demand.priorityLogs.map((log) => (
                  <li key={log.id} className="text-xs text-muted-foreground">
                    <span className="font-medium text-navy-700">{log.changedBy.name}</span>{" "}
                    mudou de <PriorityBadge priority={log.fromPriority} /> para <PriorityBadge priority={log.toPriority} />{" "}
                    em {log.createdAt.toLocaleDateString("pt-BR")}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {demand.status === "REJEITADO" && demand.rejectionReason && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <strong>Motivo da rejeição:</strong> {demand.rejectionReason}
            </div>
          )}
        </CardContent>
      </Card>

      <ProjectUrlBanner
        demandId={demand.id}
        projectUrl={demand.project?.projectUrl ?? null}
        status={demand.status}
        isDevTeam={isDevTeam(user.role)}
      />

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

      {showProjectSpec && (
        <div id="especificacao">
          <ProjectSpecForm
            demandId={demand.id}
            initialSpec={demand.project?.technicalSpec ?? ""}
            initialTechnologies={demand.project?.technologies ?? ""}
          />
        </div>
      )}

      {/* TI Updates */}
      <Card id="atualizacoes" className="p-5">
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

      <div id="comentarios">
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
      </div>

      {showSuggestions && (
        <div id="sugestoes">
          <SuggestionsSection
            demandId={demand.id}
            suggestions={demand.suggestions}
            canApprove={isDevTeam(user.role)}
          />
        </div>
      )}
    </div>
  );
}
