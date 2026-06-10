import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isDevTeam } from "@/lib/permissions";
import { StatusBadge } from "@/components/StatusBadge";

export default async function ArquivadasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isDevTeam(user.role)) redirect("/demandas");

  const demands = await prisma.demand.findMany({
    where: { status: "REJEITADO" },
    include: {
      requester: { select: { name: true } },
      department: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-navy-900">Demandas arquivadas</h1>
      <p className="mb-6 text-sm text-navy-400">Demandas rejeitadas pelo time de desenvolvimento.</p>

      <div className="space-y-2">
        {demands.map((demand) => (
          <Link
            key={demand.id}
            href={`/demandas/${demand.id}`}
            className="flex items-center justify-between rounded-xl border border-navy-100 bg-white p-4 shadow-sm transition hover:border-accent-300"
          >
            <div>
              <p className="font-medium text-navy-900">{demand.title}</p>
              <p className="text-xs text-navy-400">
                {demand.department.name} · por {demand.requester.name}
              </p>
            </div>
            <StatusBadge status={demand.status} />
          </Link>
        ))}
        {demands.length === 0 && (
          <p className="text-sm text-navy-300">Nenhuma demanda arquivada.</p>
        )}
      </div>
    </div>
  );
}
