import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
      <Card className="w-full max-w-md p-8 shadow-xl">
        <CardHeader className="mb-2 px-0 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-800 text-xl font-bold text-accent-400">
            CS
          </div>
          <h1 className="text-2xl font-semibold text-navy-900">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </CardHeader>
        <CardContent className="px-0">{children}</CardContent>
      </Card>
    </div>
  );
}
