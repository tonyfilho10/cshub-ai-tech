import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageAdmin } from "@/lib/permissions";
import { CreateUserForm } from "./CreateUserForm";
import { UsersClient } from "./UsersClient";

export default async function UsuariosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageAdmin(user)) redirect("/demandas");

  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      include: { department: { select: { name: true } } },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-xl font-semibold text-navy-900">Usuários</h1>
      <p className="mb-6 text-sm text-navy-400">
        Gerencie o papel e o setor de cada usuário da plataforma.
      </p>

      <div className="mb-4 rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-navy-700 dark:text-navy-300">Novo usuário</h2>
        <CreateUserForm departments={departments} />
      </div>

      <UsersClient users={users} departments={departments} />
    </div>
  );
}
