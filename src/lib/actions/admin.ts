"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageAdmin } from "@/lib/permissions";
import type { UserRole } from "@prisma/client";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !canManageAdmin(user)) {
    throw new Error("Sem permissão de administrador.");
  }
  return user;
}

export type SimpleFormState = { error: string | null };

export async function createDepartment(
  _prevState: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Informe o nome do setor." };

  const existing = await prisma.department.findUnique({ where: { name } });
  if (existing) return { error: "Já existe um setor com esse nome." };

  await prisma.department.create({ data: { name } });
  revalidatePath("/admin/setores");
  return { error: null };
}

export async function renameDepartment(id: string, name: string) {
  await requireAdmin();
  if (!name.trim()) throw new Error("Informe o nome do setor.");
  await prisma.department.update({ where: { id }, data: { name: name.trim() } });
  revalidatePath("/admin/setores");
}

export async function deleteDepartment(id: string) {
  await requireAdmin();
  const usage = await prisma.user.count({ where: { departmentId: id } });
  const demandUsage = await prisma.demand.count({ where: { departmentId: id } });
  if (usage > 0 || demandUsage > 0) {
    throw new Error("Não é possível excluir um setor em uso por usuários ou demandas.");
  }
  await prisma.department.delete({ where: { id } });
  revalidatePath("/admin/setores");
}

export async function updateUserRole(userId: string, role: UserRole) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/usuarios");
}

export async function updateUserDepartment(userId: string, departmentId: string) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { departmentId } });
  revalidatePath("/admin/usuarios");
}

export async function createUser(
  _prevState: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;
  const departmentId = String(formData.get("departmentId") ?? "");

  if (!name || !email || !password || !departmentId) {
    return { error: "Preencha todos os campos." };
  }
  if (password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
  }
  if (!["USER", "DEV_TEAM", "ADMIN"].includes(role)) {
    return { error: "Papel inválido." };
  }

  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) return { error: "Setor inválido." };

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) {
    return { error: error?.message ?? "Não foi possível criar o usuário." };
  }

  try {
    await prisma.user.create({
      data: { authId: data.user.id, name, email, role, departmentId },
    });
  } catch {
    return {
      error: "Usuário criado na autenticação, mas houve um erro ao vincular o perfil.",
    };
  }

  revalidatePath("/admin/usuarios");
  return { error: null };
}
