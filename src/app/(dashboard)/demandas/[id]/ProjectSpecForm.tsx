"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertProjectSpec } from "@/lib/actions/demands";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ProjectSpecForm({
  demandId,
  initialSpec,
  initialTechnologies,
}: {
  demandId: string;
  initialSpec: string;
  initialTechnologies: string;
}) {
  const [spec, setSpec] = useState(initialSpec);
  const [technologies, setTechnologies] = useState(initialTechnologies);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await upsertProjectSpec(demandId, spec, technologies);
        setSaved(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar especificação.");
      }
    });
  }

  return (
    <Card className="p-4">
      <CardContent className="px-0">
        <form onSubmit={handleSubmit}>
          <h3 className="mb-1 text-sm font-semibold text-navy-700">
            Especificação técnica do projeto
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Visível apenas para o time de desenvolvimento.
          </p>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="technologies">Tecnologias</Label>
              <Input
                id="technologies"
                value={technologies}
                onChange={(e) => setTechnologies(e.target.value)}
                placeholder="Ex: Next.js, Prisma, Supabase, Netlify"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="technicalSpec">Especificação técnica detalhada</Label>
              <Textarea
                id="technicalSpec"
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                rows={10}
                placeholder="Arquitetura, modelos de dados, integrações, fluxos, etc."
              />
            </div>
          </div>

          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          {saved && !error && (
            <p className="mt-2 text-sm text-emerald-600">Especificação salva.</p>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="mt-3 bg-navy-800 text-white hover:bg-navy-700"
          >
            {pending ? "Salvando..." : "Salvar especificação"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
