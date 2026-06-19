"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updatePassword } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [result, setResult] = useState<{ error: string | null; success: boolean } | null>(null);
  const [pending, startTransition] = useTransition();
  const [exchanging, setExchanging] = useState(true);
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setExchangeError("Link inválido ou expirado. Solicite um novo e-mail de redefinição.");
      setExchanging(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setExchangeError("Este link expirou ou já foi usado. Solicite um novo e-mail de redefinição.");
      }
      setExchanging(false);
    });
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setResult({ error: "As senhas não coincidem.", success: false });
      return;
    }
    startTransition(async () => {
      const r = await updatePassword(password);
      setResult(r);
      if (r.success) setTimeout(() => router.push("/demandas"), 2000);
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-800 text-sm font-bold text-accent-400">
            CS
          </div>
          <span className="font-semibold text-navy-900 dark:text-foreground">CSHUB</span>
        </div>

        {exchanging ? (
          <p className="text-sm text-muted-foreground">Verificando link...</p>
        ) : exchangeError ? (
          <p className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {exchangeError}
          </p>
        ) : result?.success ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-4">
              <CheckCircle size={20} className="text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Senha atualizada!</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Redirecionando...</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 dark:text-foreground">Nova senha</h2>
              <p className="mt-1 text-sm text-muted-foreground">Escolha uma senha segura para sua conta.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest text-navy-500 dark:text-navy-400">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
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

              <div className="space-y-1.5">
                <label htmlFor="confirm" className="text-xs font-semibold uppercase tracking-widest text-navy-500 dark:text-navy-400">
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="w-full rounded-xl border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900/40 px-4 py-3 pr-11 text-sm text-navy-900 dark:text-foreground placeholder:text-navy-400 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400/30 transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 dark:hover:text-navy-300 transition"
                  >
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {result?.error && (
                <p className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                  {result.error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending || !password || !confirm}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy-800 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-700 active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                {pending ? "Salvando..." : "Salvar nova senha"}
                {!pending && <ArrowRight size={16} />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
