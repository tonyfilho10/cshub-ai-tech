"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole, updateUserDepartment } from "@/lib/actions/admin";
import { ROLE_LABELS } from "@/lib/constants";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <TableRow>
      <TableCell className="px-4 py-3">
        <p className="text-sm font-medium text-navy-900">{user.name}</p>
        <p className="text-xs text-navy-400">{user.email}</p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </TableCell>
      <TableCell className="px-4 py-3">
        <Select
          defaultValue={user.role}
          disabled={pending}
          onValueChange={(value) => onRoleChange(value as UserRole)}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="px-4 py-3">
        <Select
          defaultValue={user.departmentId}
          disabled={pending}
          onValueChange={(value) => {
            if (value) onDepartmentChange(value);
          }}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}
