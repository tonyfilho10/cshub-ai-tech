import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isDevTeam } from "@/lib/permissions";
import { EisenhowerClient } from "./EisenhowerClient";

export default async function EisenhowerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isDevTeam(user.role)) redirect("/demandas");

  const suggestions = await prisma.suggestion.findMany({
    where: {
      status: { not: "REJEITADO" },
      demand: { archived: false },
    },
    include: {
      author: { select: { name: true } },
      demand: {
        select: {
          id: true,
          title: true,
          priority: true,
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-navy-900 dark:text-foreground">Matriz de Eisenhower</h1>
        <p className="text-sm text-muted-foreground">
          Sugestões das solicitações em produção, organizadas por prioridade
        </p>
      </div>
      <EisenhowerClient suggestions={suggestions} />
    </div>
  );
}
