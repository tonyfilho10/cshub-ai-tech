import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageAdmin } from "@/lib/permissions";
import { UserRow } from "./UserRow";

export default async function UsuariosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageAdmin(user)) redirect("/demandas");

  const [users, departments] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-xl font-semibold text-navy-900">Usuários</h1>
      <p className="mb-6 text-sm text-navy-400">
        Gerencie o papel e o setor de cada usuário da plataforma.
      </p>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-navy-50 text-xs uppercase text-navy-400">
            <tr>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Papel</th>
              <th className="px-4 py-3 font-medium">Setor</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow key={u.id} user={u} departments={departments} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
