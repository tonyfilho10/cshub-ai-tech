import type { Demand, UserRole } from "@prisma/client";
import type { CurrentUser } from "@/lib/auth";

export function isDevTeam(role: UserRole) {
  return role === "DEV_TEAM" || role === "ADMIN";
}

export function isAdmin(role: UserRole) {
  return role === "ADMIN";
}

/** Usuário comum só vê demandas próprias ou do mesmo departamento. */
export function canViewDemand(
  user: CurrentUser,
  demand: Pick<Demand, "requesterId" | "departmentId" | "status">
) {
  if (isDevTeam(user.role)) return true;
  return (
    demand.requesterId === user.id || demand.departmentId === user.departmentId
  );
}

/** Apenas o time de dev pode ver a especificação técnica (Project). */
export function canViewProjectSpec(user: CurrentUser) {
  return isDevTeam(user.role);
}

/** Apenas o time de dev pode mudar o status de uma demanda. */
export function canChangeStatus(user: CurrentUser) {
  return isDevTeam(user.role);
}

/** Apenas o time de dev pode criar/editar a especificação técnica. */
export function canEditProjectSpec(user: CurrentUser) {
  return isDevTeam(user.role);
}

/** Apenas admins gerenciam departamentos e usuários. */
export function canManageAdmin(user: CurrentUser) {
  return isAdmin(user.role);
}
