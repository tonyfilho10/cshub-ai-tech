"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { UserRow } from "./UserRow";
import type { Department, User } from "@prisma/client";

type UserWithDept = User & { department: { name: string } };

export function UsersClient({
  users,
  departments,
}: {
  users: UserWithDept[];
  departments: Department[];
}) {
  const [deptFilter, setDeptFilter] = useState<string>("TODOS");

  const visible = deptFilter === "TODOS"
    ? users
    : users.filter((u) => u.departmentId === deptFilter);

  return (
    <div className="rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-card shadow-sm overflow-hidden">
      {/* Header with count + filter */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-navy-100 dark:border-navy-800 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-navy-600 dark:text-navy-300">
          <Users size={15} />
          <span>
            <span className="font-semibold text-navy-900 dark:text-foreground">{visible.length}</span>
            {" "}de{" "}
            <span className="font-semibold text-navy-900 dark:text-foreground">{users.length}</span>
            {" "}usuários
          </span>
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-lg border border-navy-200 dark:border-navy-700 bg-background px-2 py-1 text-xs text-navy-700 dark:text-navy-300 focus:outline-none focus:ring-2 focus:ring-accent-400"
        >
          <option value="TODOS">Todos os setores</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 bg-navy-50 dark:bg-navy-900/30 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-navy-400">
        <span>Usuário</span>
        <span>Papel</span>
        <span>Setor</span>
        <span>Ações</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-navy-100 dark:divide-navy-800">
        {visible.map((u) => (
          <UserRow key={u.id} user={u} departments={departments} />
        ))}
        {visible.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhum usuário neste setor.
          </p>
        )}
      </div>
    </div>
  );
}
