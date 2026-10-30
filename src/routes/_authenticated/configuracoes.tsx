import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContainer, PageHeader, PageSkeleton } from "@/components/common/page";
import { currentUserQueryOptions } from "@/features/auth/api";
import { marcaQueryOptions, useMarca, useUpdateMarca } from "@/features/configuracoes/api";
import { NOME_MAX, SUBTITULO_MAX, tituloPagina, validarNomeSistema, validarSubtitulo } from "@/lib/marca";
import { friendlyError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: ({ match }) => ({
    meta: [
      { title: tituloPagina("Configurações", match.context.marca) },
      { name: "description", content: "Personalize o nome do sistema exibido para a equipe do escritório." },
      { property: "og:title", content: tituloPagina("Configurações", match.context.marca) },
      { property: "og:description", content: "Personalize o nome do sistema exibido para a equipe do escritório." },
    ],
  }),
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(currentUserQueryOptions(context.userId));
    if (me.papel !== "admin") throw redirect({ to: "/dashboard" });
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(marcaQueryOptions()),
  pendingComponent: () => <PageSkeleton />,
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const marca = useMarca();
  const update = useUpdateMarca();
  const [nome, setNome] = useState(marca.nome);
  const [subtitulo, setSubtitulo] = useState(marca.subtitulo);
  const [erro, setErro] = useState<string | null>(null);

  const alterado = nome.trim() !== marca.nome || subtitulo.trim() !== marca.subtitulo;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const msg = validarNomeSistema(nome) ?? validarSubtitulo(subtitulo);
    setErro(msg);
    if (msg) return;
    update.mutate(
      { nome, subtitulo },
      {
        onSuccess: () => toast.success("Nome do sistema atualizado para toda a equipe."),
        onError: (err) => toast.error(friendlyError(err)),
      },
    );
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Administração"
        title="Configurações"
        description="Personalize como o sistema se apresenta. O nome aparece no menu, na tela de login e nas abas do navegador."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border bg-card p-6 shadow-card">
          <div className="space-y-2">
            <Label htmlFor="nome-sistema">Nome do sistema</Label>
            <Input
              id="nome-sistema"
              value={nome}
              maxLength={NOME_MAX}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Silva & Associados"
              aria-invalid={!!erro}
            />
            <p className="text-xs text-muted-foreground">Normalmente o nome do escritório. Até {NOME_MAX} caracteres.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtitulo-sistema">Subtítulo</Label>
            <Input
              id="subtitulo-sistema"
              value={subtitulo}
              maxLength={SUBTITULO_MAX}
              onChange={(e) => setSubtitulo(e.target.value)}
              placeholder="Ex.: Advocacia Empresarial"
            />
            <p className="text-xs text-muted-foreground">Aparece abaixo do nome no menu. Pode ficar em branco.</p>
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!alterado || update.isPending}
              onClick={() => {
                setNome(marca.nome);
                setSubtitulo(marca.subtitulo);
                setErro(null);
              }}
            >
              Descartar
            </Button>
            <Button type="submit" disabled={!alterado || update.isPending}>
              {update.isPending && <Loader2 className="animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>

        <div className="space-y-2">
          <p className="eyebrow">Pré-visualização do menu</p>
          <div className="rounded-lg bg-sidebar p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <Scale className="size-4" />
              </div>
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate font-display text-lg font-semibold text-sidebar-accent-foreground">
                  {nome.trim() || "Nome do sistema"}
                </span>
                {subtitulo.trim() && (
                  <span className="truncate text-[11px] tracking-wide text-sidebar-foreground/70">{subtitulo.trim()}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
