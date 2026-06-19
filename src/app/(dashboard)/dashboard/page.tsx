import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isDevTeam } from "@/lib/permissions";
import { FileText, Hammer, Rocket, ArrowRight, ExternalLink } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isGestao = user.department.name === "Gestão";
  const canSeeAll = isDevTeam(user.role) || isGestao;

  const baseWhere = canSeeAll ? {} : { departmentId: user.departmentId };

  const [rascunho, emDesenvolvimento, total, producaoProjects] = await Promise.all([
    prisma.demand.count({
      where: { ...baseWhere, archived: false, status: { in: ["SOLICITADO", "EM_ANALISE", "APROVADO"] } },
    }),
    prisma.demand.count({
      where: { ...baseWhere, archived: false, status: { in: ["EM_DESENVOLVIMENTO", "EM_TESTE"] } },
    }),
    prisma.demand.count({
      where: { ...baseWhere, archived: false, status: { not: "REJEITADO" } },
    }),
    prisma.demand.findMany({
      where: { ...baseWhere, archived: false, status: "EM_PRODUCAO" },
      include: {
        department: { select: { name: true } },
        requester: { select: { name: true } },
        project: { select: { technologies: true, projectUrl: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-navy-900">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {canSeeAll ? "Visão geral de todas as solicitações" : `Visão geral do setor ${user.department.name}`}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Em rascunho"
          description="Solicitado · Em análise · Aprovado"
          value={rascunho}
          total={total}
          icon={<FileText size={20} />}
          color="text-sky-600"
          bg="bg-sky-50"
          border="border-sky-100"
          barColor="#38bdf8"
        />
        <StatCard
          label="Em desenvolvimento"
          description="Em desenvolvimento · Em teste"
          value={emDesenvolvimento}
          total={total}
          icon={<Hammer size={20} />}
          color="text-amber-600"
          bg="bg-amber-50"
          border="border-amber-100"
          barColor="#fbbf24"
        />
        <StatCard
          label="Em produção"
          description="Entregue e em uso"
          value={producaoProjects.length}
          total={total}
          icon={<Rocket size={20} />}
          color="text-emerald-600"
          bg="bg-emerald-50"
          border="border-emerald-100"
          barColor="#34d399"
        />
      </div>

      {/* Projetos em produção */}
      {producaoProjects.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-navy-700">Projetos em produção</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {producaoProjects.map((demand) => (
              <Link key={demand.id} href={`/demandas/${demand.id}`}>
                <div className="group rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-card p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Rocket size={15} />
                    </div>
                    <ArrowRight size={15} className="shrink-0 text-navy-300 transition group-hover:text-emerald-500 mt-0.5" />
                  </div>
                  <p className="mt-3 font-medium text-navy-900 line-clamp-2 leading-snug">{demand.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{demand.department.name} · por {demand.requester.name}</p>
                  {demand.project?.technologies && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {demand.project.technologies.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 3).map((tech) => (
                        <span key={tech} className="rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  {demand.project?.projectUrl && (
                    <a
                      href={demand.project.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 flex items-center gap-1 text-xs text-emerald-600 hover:underline"
                    >
                      <ExternalLink size={11} />
                      Acessar projeto
                    </a>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  description,
  value,
  total,
  icon,
  color,
  bg,
  border,
  barColor,
}: {
  label: string;
  description: string;
  value: number;
  total: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  barColor: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className={`rounded-xl border ${border} bg-white dark:bg-card p-5 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-navy-500">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`rounded-lg p-2 ${bg} ${color}`}>{icon}</div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{description}</p>
      <div className="mt-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{pct}% do total</span>
          <span>{total} no total</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-navy-100">
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>
      </div>
    </div>
  );
}
