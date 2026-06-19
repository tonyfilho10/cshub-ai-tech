"use client";

import { useActionState, useState, useTransition } from "react";
import { login, resetPassword, type AuthFormState } from "@/lib/actions/auth";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Zap, BarChart3, Users, CheckSquare } from "lucide-react";

const initialState: AuthFormState = { error: null };

const FEATURES = [
  { icon: Zap,         text: "Solicitações de desenvolvimento centralizadas" },
  { icon: BarChart3,   text: "Acompanhamento de status em tempo real" },
  { icon: Users,       text: "Comunicação direta entre setores e TI" },
  { icon: CheckSquare, text: "Priorização inteligente com matriz Eisenhower" },
];

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPw, setShowPw] = useState(false);
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetState, setResetState] = useState<{ error: string | null; success: boolean } | null>(null);
  const [resetPending, startReset] = useTransition();

  function handleReset() {
    startReset(async () => {
      const result = await resetPassword(resetEmail);
      setResetState(result);
    });
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel (always dark) ── */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between bg-[#0b1f3a] p-12 text-white">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-400 text-sm font-bold text-navy-900">
            CS
          </div>
          <div>
            <p className="text-sm font-bold leading-tight tracking-tight">CSHUB</p>
            <p className="text-[10px] text-[#84a3c9] uppercase tracking-widest">Desenvolvimento</p>
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight">
              Gestão de<br />
              <span className="text-accent-400">solicitações</span><br />
              que funciona.
            </h1>
            <p className="mt-4 text-sm text-[#84a3c9] leading-relaxed max-w-xs">
              Centralize pedidos de desenvolvimento, acompanhe prioridades e mantenha todos alinhados.
            </p>
          </div>

          <div className="h-px w-12 bg-accent-400/50" />

          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-[#b8cfe8]">
                <Icon size={15} className="text-accent-400 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-xs text-[#4a6a8a]">
          CSHUB · Plataforma interna de desenvolvimento
        </p>
      </div>

      {/* ── Right panel (theme-aware) ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-800 text-sm font-bold text-accent-400">
            CS
          </div>
          <span className="font-semibold text-navy-900 dark:text-foreground">CSHUB</span>
        </div>

        <div className="w-full max-w-sm">
          {mode === "login" ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-navy-900 dark:text-foreground">Bem-vindo</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Entre com suas credenciais para continuar
                </p>
              </div>

              <form action={formAction} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-navy-500 dark:text-navy-400">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    className="w-full rounded-xl border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900/40 px-4 py-3 text-sm text-navy-900 dark:text-foreground placeholder:text-navy-400 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400/30 transition"
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest text-navy-500 dark:text-navy-400">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => { setMode("reset"); setResetState(null); }}
                      className="text-xs text-accent-600 dark:text-accent-400 hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPw ? "text" : "password"}
                      name="password"
                      required
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900/40 px-4 py-3 pr-11 text-sm text-navy-900 dark:text-foreground placeholder:text-navy-400 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400/30 transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 dark:hover:text-navy-300 transition"
                    >
                      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {state.error && (
                  <p className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                    {state.error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy-800 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-700 active:scale-[0.98] disabled:opacity-50 transition-all"
                >
                  {pending ? "Entrando..." : "Entrar"}
                  {!pending && <ArrowRight size={16} />}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setMode("login"); setResetState(null); setResetEmail(""); }}
                className="mb-6 flex items-center gap-1.5 text-sm text-navy-500 dark:text-navy-400 hover:text-navy-800 dark:hover:text-foreground transition"
              >
                <ArrowLeft size={15} /> Voltar ao login
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-navy-900 dark:text-foreground">Recuperar senha</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enviaremos um link de redefinição para o seu e-mail.
                </p>
              </div>

              {resetState?.success ? (
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-4 text-sm text-emerald-700 dark:text-emerald-400">
                  <p className="font-medium">E-mail enviado!</p>
                  <p className="mt-1 text-xs opacity-80">Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label htmlFor="reset-email" className="text-xs font-semibold uppercase tracking-widest text-navy-500 dark:text-navy-400">
                      E-mail
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      autoComplete="email"
                      className="w-full rounded-xl border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900/40 px-4 py-3 text-sm text-navy-900 dark:text-foreground placeholder:text-navy-400 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400/30 transition"
                      placeholder="seu@email.com"
                      onKeyDown={(e) => { if (e.key === "Enter") handleReset(); }}
                    />
                  </div>

                  {resetState?.error && (
                    <p className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                      {resetState.error}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={resetPending || !resetEmail.trim()}
                    onClick={handleReset}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy-800 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-700 active:scale-[0.98] disabled:opacity-50 transition-all"
                  >
                    {resetPending ? "Enviando..." : "Enviar link de recuperação"}
                    {!resetPending && <ArrowRight size={16} />}
                  </button>
                </div>
              )}
            </>
          )}

          <p className="mt-10 text-center text-xs text-muted-foreground">
            CSHUB · Powered by CSHub
          </p>
        </div>
      </div>
    </div>
  );
}
