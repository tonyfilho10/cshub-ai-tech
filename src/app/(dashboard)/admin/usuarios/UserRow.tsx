"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole, updateUserDepartment } from "@/lib/actions/admin";
import { ROLE_LABELS } from "@/lib/constants";
import type { Department, User, UserRole } from "@prisma/client";

const ROLES: UserRole[] = ["USER", "DEV_TEAM", "ADMIN"];

export function UserRow({
  user,
  departments,
}: {
  user: User;
  departments: Department[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function onRoleChange(role: UserRole) {
    setError(null);
    startTransition(async () => {
      try {
        await updateUserRole(user.id, role);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao atualizar.");
      }
    });
  }

  function onDepartmentChange(departmentId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await updateUserDepartment(user.id, departmentId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao atualizar.");
      }
    });
  }

  return (
    <tr className="border-b border-navy-100 last:border-0">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-navy-900">{user.name}</p>
        <p className="text-xs text-navy-400">{user.email}</p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </td>
      <td className="px-4 py-3">
        <select
          defaultValue={user.role}
          disabled={pending}
          onChange={(e) => onRoleChange(e.target.value as UserRole)}
          className="rounded-lg border border-navy-200 px-2 py-1 text-sm text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500"
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <select
          defaultValue={user.departmentId}
          disabled={pending}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className="rounded-lg border border-navy-200 px-2 py-1 text-sm text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500"
        >
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </td>
    </tr>
  );
}
