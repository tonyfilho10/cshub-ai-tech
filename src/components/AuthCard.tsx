import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-800 text-xl font-bold text-accent-400">
            CS
          </div>
          <h1 className="text-2xl font-semibold text-navy-900">{title}</h1>
          <p className="mt-1 text-sm text-navy-400">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
