import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isDevTeam, canChangeStatus, SHARED_DEPARTMENT_NAME } from "@/lib/permissions";
import { DemandasList } from "./DemandasList";
import { NovaSolicitacaoDialog } from "./NovaSolicitacaoDialog";

export default async function DemandasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isGestao = user.department.name === "Gestão";

  const where = isDevTeam(user.role) || isGestao
    ? { status: { not: "REJEITADO" as const }, archived: false }
    : {
        status: { not: "REJEITADO" as const },
        archived: false,
        OR: [
          { departmentId: user.departmentId },
          { department: { name: SHARED_DEPARTMENT_NAME } },
        ],
      };

  const [demands, allDepartments, mentionableUsers] = await Promise.all([
    prisma.demand.findMany({
      where,
      include: {
        requester: { select: { name: true } },
        department: { select: { id: true, name: true } },
        reactions: { include: { author: { select: { id: true } } } },
        comments: {
          where: { parentId: null },
          take: 3,
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { name: true, avatarUrl: true } },
            replies: {
              orderBy: { createdAt: "asc" },
              include: { author: { select: { name: true, avatarUrl: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const departments = isDevTeam(user.role) || isGestao ? allDepartments : [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-navy-900">Solicitações de Desenvolvimento</h1>
          <p className="text-sm text-muted-foreground">
            {isDevTeam(user.role) || isGestao
              ? "Todas as solicitações em andamento"
              : `Solicitações do setor ${user.department.name}`}
          </p>
        </div>
        <NovaSolicitacaoDialog departments={allDepartments} defaultDepartmentId={user.departmentId} />
      </div>

      <DemandasList
        demands={demands.map((d) => ({
          ...d,
          commentCount: d.comments.length,
          recentComments: [...d.comments].reverse(),
        }))}
        departments={departments}
        canChangeStatus={canChangeStatus(user)}
        userId={user.id}
        canArchive={isDevTeam(user.role)}
        mentionableUsers={mentionableUsers}
      />
    </div>
  );
}
