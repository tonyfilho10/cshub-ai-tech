"use server";

import { redirect } from "next/navigation";
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

export async function resetPassword(email: string): Promise<{ error: string | null; success: boolean }> {
  if (!email?.trim()) return { error: "Informe seu e-mail.", success: false };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/reset-password`,
  });

  if (error) return { error: "Não foi possível enviar o e-mail. Verifique o endereço.", success: false };
  return { error: null, success: true };
}

export async function updatePassword(password: string): Promise<{ error: string | null; success: boolean }> {
  if (!password || password.length < 6) return { error: "A senha deve ter pelo menos 6 caracteres.", success: false };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Não foi possível atualizar a senha.", success: false };
  return { error: null, success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
