import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isDevTeam } from "@/lib/permissions";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";

export default async function ArquivadasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isDevTeam(user.role)) redirect("/demandas");

  const demands = await prisma.demand.findMany({
    where: { OR: [{ status: "REJEITADO" }, { archived: true }] },
    include: {
      requester: { select: { name: true } },
      department: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-navy-900">Solicitações arquivadas</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Solicitações rejeitadas ou arquivadas pelo time de desenvolvimento.
      </p>

      <div className="space-y-2">
        {demands.map((demand) => (
          <Link key={demand.id} href={`/demandas/${demand.id}`}>
            <Card className="flex-row items-center justify-between p-4 transition hover:border-accent-300">
              <div>
                <p className="font-medium text-navy-900">{demand.title}</p>
                <p className="text-xs text-muted-foreground">
                  {demand.department.name} · por {demand.requester.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={demand.status} />
                {demand.archived && (
                  <span className="rounded-full bg-navy-100 px-2 py-0.5 text-xs text-navy-500">Arquivado</span>
                )}
              </div>
            </Card>
          </Link>
        ))}
        {demands.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma solicitação arquivada.</p>
        )}
      </div>
    </div>
  );
}
