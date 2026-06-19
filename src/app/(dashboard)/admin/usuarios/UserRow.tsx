"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole, updateUserDepartment } from "@/lib/actions/admin";
import { ROLE_LABELS } from "@/lib/constants";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Department, User, UserRole } from "@prisma/client";

const ROLES: UserRole[] = ["USER", "DEV_TEAM", "ADMIN"];

type UserWithDept = User & { department: { name: string } };

export function UserRow({
  user,
  departments,
}: {
  user: UserWithDept;
  departments: Department[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState(user.departmentId);
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
    setSelectedDeptId(departmentId);
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
    <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 items-center px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="sm" className="shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-navy-900 dark:text-foreground truncate">{user.name}</p>
          <p className="text-xs text-navy-400 truncate">{user.email}</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
      <div>
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
      </div>
      <div>
        <Select
          value={selectedDeptId}
          disabled={pending}
          onValueChange={(value) => {
            if (value) onDepartmentChange(value);
          }}
        >
          <SelectTrigger size="sm">
            <SelectValue>
              {departments.find((d) => d.id === selectedDeptId)?.name ?? "—"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
