"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { updateUserRole, updateUserDepartment, updateUser, deleteUser } from "@/lib/actions/admin";
import { ROLE_LABELS } from "@/lib/constants";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  function saveProfile() {
    setError(null);
    startTransition(async () => {
      try {
        await updateUser(user.id, name, email);
        setEditing(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao salvar.");
      }
    });
  }

  function cancelEdit() {
    setName(user.name);
    setEmail(user.email);
    setEditing(false);
  }

  function removeUser() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteUser(user.id);
        setConfirmDelete(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao excluir.");
        setConfirmDelete(false);
      }
    });
  }

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
    <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="sm" className="shrink-0" />
        {editing ? (
          <div className="min-w-0 flex-1 space-y-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome"
              className="h-7 text-sm"
              disabled={pending}
            />
            <Input
              value={email}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="h-7 text-xs"
              disabled={pending}
            />
          </div>
        ) : (
          <div className="min-w-0">
            <p className="text-sm font-medium text-navy-900 dark:text-foreground truncate">{user.name}</p>
            <p className="text-xs text-navy-400 truncate">{user.email}</p>
          </div>
        )}
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
      <div className="flex items-center gap-1">
        {editing ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              onClick={saveProfile}
              className="text-emerald-600 hover:bg-emerald-50"
            >
              <Check size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              onClick={cancelEdit}
            >
              <X size={16} />
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditing(true)}
            >
              <Pencil size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              onClick={() => setConfirmDelete(true)}
              className="text-red-500 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </Button>
          </>
        )}
      </div>

      {error && (
        <p className="col-span-4 text-xs text-red-600">{error}</p>
      )}

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{user.name}</strong>? Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" onClick={removeUser} disabled={pending} className="bg-red-600 text-white hover:bg-red-700">
              {pending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
