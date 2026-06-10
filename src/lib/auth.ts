import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@prisma/client";

export type CurrentUser = User & {
  department: { id: string; name: string };
};

/**
 * Retorna o usuário autenticado (Supabase Auth) já combinado com o registro
 * correspondente na tabela `User` do Prisma, incluindo o departamento.
 * Retorna `null` se não houver sessão ou se o usuário ainda não tiver
 * sido provisionado na tabela `User`.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const user = await prisma.user.findUnique({
    where: { authId: authUser.id },
    include: { department: { select: { id: true, name: true } } },
  });

  return user;
}
