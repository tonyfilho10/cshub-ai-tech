import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isDevTeam } from "@/lib/permissions";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";

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
          <p className="text-sm text-navy-400">
            {isDevTeam(user.role)
              ? "Todas as demandas em andamento"
              : "Suas demandas e as do seu setor"}
          </p>
        </div>
        <Link
          href="/demandas/nova"
          className="rounded-lg bg-accent-400 px-4 py-2 text-sm font-medium text-navy-900 transition hover:bg-accent-500"
        >
          + Nova Demanda
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 overflow-x-auto md:grid-cols-3 xl:grid-cols-6">
        {columns.map(({ status, items }) => (
          <div key={status} className="min-w-[220px] rounded-xl bg-white p-3 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-navy-700">
              {STATUS_LABELS[status]}{" "}
              <span className="text-navy-300">({items.length})</span>
            </h2>
            <div className="space-y-2">
              {items.map((demand) => (
                <Link
                  key={demand.id}
                  href={`/demandas/${demand.id}`}
                  className="block rounded-lg border border-navy-100 p-3 text-sm transition hover:border-accent-300 hover:shadow"
                >
                  <p className="font-medium text-navy-900 line-clamp-2">{demand.title}</p>
                  <p className="mt-1 text-xs text-navy-400">{demand.department.name}</p>
                  <p className="text-xs text-navy-300">por {demand.requester.name}</p>
                </Link>
              ))}
              {items.length === 0 && (
                <p className="text-xs text-navy-300">Nenhuma demanda</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
