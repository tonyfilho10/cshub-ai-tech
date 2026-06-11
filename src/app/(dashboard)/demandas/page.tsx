import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isDevTeam } from "@/lib/permissions";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { NovaSolicitacaoDialog } from "./NovaSolicitacaoDialog";

export default async function DemandasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const where = isDevTeam(user.role)
    ? { status: { not: "REJEITADO" as const } }
    : {
        status: { not: "REJEITADO" as const },
        OR: [{ requesterId: user.id }, { departmentId: user.departmentId }],
      };

  const demands = await prisma.demand.findMany({
    where,
    include: {
      requester: { select: { name: true } },
      department: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const columns = STATUS_ORDER.map((status) => ({
    status,
    items: demands.filter((d) => d.status === status),
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-navy-900">Demandas</h1>
          <p className="text-sm text-muted-foreground">
            {isDevTeam(user.role)
              ? "Todas as demandas em andamento"
              : "Suas demandas e as do seu setor"}
          </p>
        </div>
        <NovaSolicitacaoDialog />
      </div>

      <div className="grid grid-cols-1 gap-4 overflow-x-auto md:grid-cols-3 xl:grid-cols-6">
        {columns.map(({ status, items }) => (
          <Card key={status} className="min-w-[220px] gap-3 p-3">
            <h2 className="text-sm font-semibold text-navy-700">
              {STATUS_LABELS[status]}{" "}
              <span className="text-muted-foreground">({items.length})</span>
            </h2>
            <div className="space-y-2">
              {items.map((demand) => (
                <Link key={demand.id} href={`/demandas/${demand.id}`} className="block">
                  <Card className="gap-1 p-3 text-sm transition hover:border-accent-300 hover:shadow">
                    <p className="font-medium text-navy-900 line-clamp-2">{demand.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{demand.department.name}</p>
                    <p className="text-xs text-muted-foreground">por {demand.requester.name}</p>
                  </Card>
                </Link>
              ))}
              {items.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhuma demanda</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
