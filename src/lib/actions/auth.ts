"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = { error: string | null };

export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-mail ou senha inválidos." };
  }

  redirect("/demandas");
}

export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const departmentId = String(formData.get("departmentId") ?? "");

  if (!name || !email || !password || !departmentId) {
    return { error: "Preencha todos os campos." };
  }

  if (password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
  }

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });
  if (!department) {
    return { error: "Setor inválido." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error || !data.user) {
    return { error: error?.message ?? "Não foi possível criar a conta." };
  }

  try {
    await prisma.user.create({
      data: {
        authId: data.user.id,
        name,
        email,
        departmentId,
      },
    });
  } catch {
    return {
      error: "Conta criada, mas houve um erro ao vincular o perfil. Contate o suporte.",
    };
  }

  redirect("/demandas");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
