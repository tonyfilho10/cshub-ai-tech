import type { DemandStatus, UserRole } from "@prisma/client";

export const STATUS_ORDER: DemandStatus[] = [
  "SOLICITADO",
  "EM_ANALISE",
  "APROVADO",
  "EM_DESENVOLVIMENTO",
  "EM_TESTE",
  "EM_PRODUCAO",
];

export const STATUS_LABELS: Record<DemandStatus, string> = {
  SOLICITADO: "Solicitado",
  EM_ANALISE: "Em Análise",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
  EM_DESENVOLVIMENTO: "Em Desenvolvimento",
  EM_TESTE: "Em Teste",
  EM_PRODUCAO: "Em Produção",
};

export const STATUS_BADGE_CLASSES: Record<DemandStatus, string> = {
  SOLICITADO: "bg-gray-100 text-gray-700 border-gray-300",
  EM_ANALISE: "bg-sky-100 text-sky-700 border-sky-300",
  APROVADO: "bg-emerald-100 text-emerald-700 border-emerald-300",
  REJEITADO: "bg-red-100 text-red-700 border-red-300",
  EM_DESENVOLVIMENTO: "bg-accent-100 text-accent-700 border-accent-300",
  EM_TESTE: "bg-amber-100 text-amber-700 border-amber-300",
  EM_PRODUCAO: "bg-navy-100 text-navy-800 border-navy-300",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  USER: "Usuário",
  DEV_TEAM: "Time de Desenvolvimento",
  ADMIN: "Administrador",
};

/** Próximos status possíveis a partir do status atual (fluxo do time de dev). */
export const NEXT_STATUSES: Record<DemandStatus, DemandStatus[]> = {
  SOLICITADO: ["EM_ANALISE", "REJEITADO"],
  EM_ANALISE: ["APROVADO", "REJEITADO"],
  APROVADO: ["EM_DESENVOLVIMENTO"],
  REJEITADO: [],
  EM_DESENVOLVIMENTO: ["EM_TESTE"],
  EM_TESTE: ["EM_PRODUCAO", "EM_DESENVOLVIMENTO"],
  EM_PRODUCAO: [],
};
