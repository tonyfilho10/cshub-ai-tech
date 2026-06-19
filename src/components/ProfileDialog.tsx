"use client";

import { useState, useTransition, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateAvatar, updatePassword, updateName } from "@/lib/actions/profile";
import { Camera, KeyRound, X, UserPen } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";

type Tab = "avatar" | "name" | "password";

export function ProfileDialog({
  name,
  email,
  role,
  department,
  avatarUrl,
  userId,
  children,
}: {
  name: string;
  email: string;
  role: string;
  department: string;
  avatarUrl: string | null;
  userId: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("avatar");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [nameValue, setNameValue] = useState(name);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop();
        const path = `avatars/${userId}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true });

        if (uploadError) throw new Error(uploadError.message);

        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        const url = `${data.publicUrl}?t=${Date.now()}`;
        await updateAvatar(url);
        setPreview(url);
        setSuccess("Foto atualizada!");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao fazer upload.");
      }
    });
  }

  function handlePasswordSubmit() {
    setError(null);
    setSuccess(null);
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    startTransition(async () => {
      try {
        await updatePassword(password);
        setPassword("");
        setConfirm("");
        setSuccess("Senha atualizada!");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao atualizar senha.");
      }
    });
  }

  function handleNameSubmit() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        await updateName(nameValue);
        setSuccess("Nome atualizado!");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao atualizar nome.");
      }
    });
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "avatar", label: "Foto" },
    { key: "name", label: "Nome" },
    { key: "password", label: "Senha" },
  ];

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        {children}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-card shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-navy-100 dark:border-navy-800 px-5 py-4">
              <h2 className="text-sm font-semibold text-navy-900 dark:text-foreground">Meu perfil</h2>
              <button type="button" onClick={() => { setOpen(false); setError(null); setSuccess(null); }}
                className="text-navy-400 hover:text-navy-700 dark:hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            {/* Avatar + info */}
            <div className="flex flex-col items-center gap-2 px-5 py-5">
              <div className="relative">
                <UserAvatar name={name} avatarUrl={preview} size="lg" />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 rounded-full bg-accent-400 p-1.5 text-navy-900 shadow hover:bg-accent-500">
                  <Camera size={12} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-navy-900 dark:text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">{email}</p>
                <p className="text-xs text-muted-foreground">{role} · {department}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-t border-navy-100 dark:border-navy-800">
              {TABS.map((t) => (
                <button key={t.key} type="button" onClick={() => { setTab(t.key); setError(null); setSuccess(null); }}
                  className={`flex-1 py-2.5 text-xs font-medium transition ${tab === t.key ? "border-b-2 border-accent-400 text-accent-600" : "text-muted-foreground hover:text-navy-700 dark:hover:text-foreground"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="px-5 py-4 space-y-3">
              {tab === "avatar" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Clique na câmera acima para escolher uma nova foto de perfil.</p>
                  {pending && <p className="text-xs text-navy-500">Enviando...</p>}
                </div>
              )}

              {tab === "name" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-navy-700 dark:text-foreground">Seu nome</label>
                    <input
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      className="w-full rounded-lg border border-navy-200 dark:border-navy-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
                    />
                  </div>
                  <button type="button" disabled={pending || !nameValue.trim()} onClick={handleNameSubmit}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-800 px-4 py-2 text-sm font-medium text-white hover:bg-navy-700 disabled:opacity-40">
                    <UserPen size={14} />
                    {pending ? "Salvando..." : "Atualizar nome"}
                  </button>
                </div>
              )}

              {tab === "password" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-navy-700 dark:text-foreground">Nova senha</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-navy-200 dark:border-navy-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-navy-700 dark:text-foreground">Confirmar senha</label>
                    <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                      className="w-full rounded-lg border border-navy-200 dark:border-navy-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400" />
                  </div>
                  <button type="button" disabled={pending || !password || !confirm} onClick={handlePasswordSubmit}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-800 px-4 py-2 text-sm font-medium text-white hover:bg-navy-700 disabled:opacity-40">
                    <KeyRound size={14} />
                    {pending ? "Salvando..." : "Atualizar senha"}
                  </button>
                </div>
              )}

              {error && <p className="text-xs text-red-600">{error}</p>}
              {success && <p className="text-xs text-emerald-600">{success}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
