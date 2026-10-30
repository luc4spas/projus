import { createFileRoute, redirect } from "@tanstack/react-router";
import { tituloPagina } from "@/lib/marca";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Search, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageContainer, PageHeader, PageSkeleton } from "@/components/common/page";
import { PapelBadge } from "@/components/common/status-badges";
import { ConfirmDelete } from "@/components/common/confirm-delete";
import { equipeQueryOptions, erroUsuario, useExcluirUsuario, useUpdatePapel } from "@/features/equipe/api";
import { UsuarioFormDialog } from "@/features/equipe/usuario-form-dialog";
import { currentUserQueryOptions } from "@/features/auth/api";
import { useCurrentUser } from "@/features/auth/use-current-user";
import { PAPEL_LABEL, type Papel } from "@/lib/domain";
import { initials } from "@/lib/format";
import { friendlyError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: ({ match }) => ({
    meta: [
      { title: tituloPagina("Equipe e acessos", match.context.marca) },
      { name: "description", content: "Cadastre, edite e remova usuários e defina os papéis de acesso do escritório." },
      { property: "og:title", content: tituloPagina("Equipe e acessos", match.context.marca) },
      { property: "og:description", content: "Cadastre, edite e remova usuários e defina os papéis de acesso do escritório." },
    ],
  }),
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(currentUserQueryOptions(context.userId));
    if (me.papel !== "admin") throw redirect({ to: "/dashboard" });
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(equipeQueryOptions()),
  pendingComponent: () => <PageSkeleton />,
  component: EquipePage,
});

const PAPEIS: Papel[] = ["admin", "advogado", "cliente"];

function EquipePage() {
  const me = useCurrentUser();
  const { data: membros } = useSuspenseQuery(equipeQueryOptions());
  const update = useUpdatePapel();
  const excluir = useExcluirUsuario();
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return membros;
    return membros.filter((m) => m.nome.toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q));
  }, [membros, busca]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Administração"
        title="Equipe e acessos"
        description="Cadastre as contas da equipe, defina o papel de cada pessoa e remova quem não deve mais acessar."
        actions={
          <UsuarioFormDialog
            trigger={
              <Button>
                <UserPlus /> Novo usuário
              </Button>
            }
          />
        }
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {PAPEIS.map((p) => (
          <div key={p} className="rounded-lg border bg-card p-4 shadow-card">
            <div className="flex items-center justify-between">
              <PapelBadge papel={p} />
              <span className="text-xs tabular-nums text-muted-foreground">{membros.filter((m) => m.papel === p).length}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {p === "admin" && "Acesso total: leitura, edição, exclusão e gestão de acessos."}
              {p === "advogado" && "Vê e atualiza apenas os processos, tarefas e documentos sob sua responsabilidade."}
              {p === "cliente" && "Sem acesso à área do escritório até ser promovido."}
            </p>
          </div>
        ))}
      </div>
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail" className="pl-9" />
      </div>
      <div className="overflow-hidden rounded-lg border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Membro</TableHead>
              <TableHead className="hidden md:table-cell">E-mail</TableHead>
              <TableHead className="w-48">Papel</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((m) => {
              const proprio = m.id === me.id;
              return (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-secondary text-xs font-semibold">{initials(m.nome)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {m.nome}
                          {proprio && <span className="ml-1 text-xs text-muted-foreground">(você)</span>}
                        </p>
                        <p className="truncate text-xs text-muted-foreground md:hidden">{m.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{m.email}</TableCell>
                  <TableCell>
                    {proprio ? (
                      <PapelBadge papel={m.papel} />
                    ) : (
                      <Select
                        value={m.papel}
                        disabled={update.isPending}
                        onValueChange={(v) =>
                          update.mutate(
                            { userId: m.id, papel: v as Papel },
                            {
                              onSuccess: () => toast.success(`${m.nome} agora é ${PAPEL_LABEL[v as Papel]}.`),
                              onError: (e) => toast.error(friendlyError(e)),
                            },
                          )
                        }
                      >
                        <SelectTrigger className="h-8" aria-label={`Papel de ${m.nome}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAPEIS.map((p) => (
                            <SelectItem key={p} value={p}>
                              {PAPEL_LABEL[p]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <UsuarioFormDialog
                        membro={m}
                        proprio={proprio}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label={`Editar ${m.nome}`}>
                            <Pencil />
                          </Button>
                        }
                      />
                      {!proprio && (
                        <ConfirmDelete
                          title={`Excluir ${m.nome}?`}
                          description="A conta será removida e a pessoa perde o acesso imediatamente. Processos e tarefas sob sua responsabilidade continuam no sistema, sem responsável, e podem ser reatribuídos."
                          onConfirm={() =>
                            excluir.mutateAsync(m.id).then(
                              () => toast.success("Usuário excluído."),
                              (e) => toast.error(erroUsuario(e, "Não foi possível excluir o usuário.")),
                            )
                          }
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Excluir ${m.nome}`}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 />
                            </Button>
                          }
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!filtrados.length && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" /> Você não pode alterar o próprio papel nem excluir a própria conta, evitando perda acidental de acesso.
      </p>
    </PageContainer>
  );
}
