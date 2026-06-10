import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageAdmin } from "@/lib/permissions";
import { NewDepartmentForm } from "./NewDepartmentForm";
import { DepartmentRow } from "./DepartmentRow";

export default async function SetoresPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageAdmin(user)) redirect("/demandas");

  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold text-navy-900">Setores</h1>
      <p className="mb-6 text-sm text-navy-400">
        Gerencie os setores/departamentos disponíveis para os usuários.
      </p>

      <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <NewDepartmentForm />
      </div>

      <ul className="space-y-2">
        {departments.map((d) => (
          <DepartmentRow key={d.id} department={d} />
        ))}
      </ul>
    </div>
  );
}
