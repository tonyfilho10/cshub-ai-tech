import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isDevTeam, canChangeStatus } from "@/lib/permissions";
import { DemandasList } from "./DemandasList";
import { NovaSolicitacaoDialog } from "./NovaSolicitacaoDialog";

export default async function DemandasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { q } = await searchParams;

  const [demands, allDepartments, mentionableUsers] = await Promise.all([
    prisma.demand.findMany({
      where: { status: { not: "REJEITADO" as const }, archived: false },
      include: {
        requester: { select: { name: true } },
        department: { select: { id: true, name: true } },
        project: { select: { projectUrl: true } },
        reactions: { include: { author: { select: { id: true } } } },
        attachments: true,
        comments: {
          where: { parentId: null },
          take: 3,
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { name: true, avatarUrl: true } },
            attachments: true,
            replies: {
              orderBy: { createdAt: "asc" },
              include: { author: { select: { name: true, avatarUrl: true } }, attachments: true },
            },
          },
        },
        suggestions: {
          where: { sourceCommentId: { not: null } },
          select: { sourceCommentId: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-navy-900">Solicitações de Desenvolvimento</h1>
          <p className="text-sm text-muted-foreground">Todas as solicitações em andamento</p>
        </div>
        <NovaSolicitacaoDialog departments={allDepartments} defaultDepartmentId={user.departmentId} />
      </div>

      <DemandasList
        demands={demands.map((d) => ({
          ...d,
          commentCount: d.comments.length,
          recentComments: [...d.comments].reverse(),
          promotedCommentIds: d.suggestions.map((s) => ({ commentId: s.sourceCommentId!, status: s.status })),
        }))}
        departments={allDepartments}
        initialSearch={q ?? ""}
        canChangeStatus={canChangeStatus(user)}
        userId={user.id}
        canArchive={isDevTeam(user.role)}
        isDevTeam={isDevTeam(user.role)}
        mentionableUsers={mentionableUsers}
      />
    </div>
  );
}
