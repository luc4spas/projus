import { createFileRoute } from "@tanstack/react-router";
import { tituloPagina } from "@/lib/marca";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageContainer, PageHeader, PageSkeleton } from "@/components/common/page";
import { ConfirmDelete } from "@/components/common/confirm-delete";
import { clientesQueryOptions, useDeleteCliente } from "@/features/clientes/api";
import { ClienteFormDialog } from "@/features/clientes/cliente-form-dialog";
import { usePermissions } from "@/features/auth/use-current-user";
import { formatDocumento, onlyDigits } from "@/lib/documento";
import { formatDate } from "@/lib/format";
import { TIPOS_CLIENTE } from "@/lib/domain";
import { friendlyError } from "@/lib/errors";
import { parseTelefones, whatsappLink } from "@/lib/telefone";
import { formatEnderecoLinha } from "@/lib/endereco";
import type { Cliente } from "@/features/clientes/api";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: ({ match }) => ({
    meta: [
      { title: tituloPagina("Clientes", match.context.marca) },
      { name: "description", content: "Carteira de clientes pessoas físicas e jurídicas do escritório." },
      { property: "og:title", content: tituloPagina("Clientes", match.context.marca) },
      { property: "og:description", content: "Carteira de clientes pessoas físicas e jurídicas do escritório." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(clientesQueryOptions()),
  pendingComponent: () => <PageSkeleton />,
  component: ClientesPage,
});

function ClientesPage() {
  const { data: clientes } = useSuspenseQuery(clientesQueryOptions());
  const { canDelete } = usePermissions();
  const del = useDeleteCliente();
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<string>("todos");

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const qDigits = onlyDigits(q);
    return clientes.filter(
      (c) =>
        (tipo === "todos" || c.tipo === tipo) &&
        (!q || c.nome.toLowerCase().includes(q) || (qDigits && c.documento.includes(qDigits)) || c.email?.toLowerCase().includes(q)),
    );
  }, [clientes, busca, tipo]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Carteira"
        title="Clientes"
        description="Pessoas físicas e jurídicas representadas pelo escritório."
        actions={
          <ClienteFormDialog
            trigger={
              <Button>
                <Plus /> Novo cliente
              </Button>
            }
          />
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, CPF/CNPJ ou e-mail" className="pl-9" />
        </div>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {TIPOS_CLIENTE.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {clientes.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente cadastrado"
          description="Cadastre o primeiro cliente para vincular processos a ele."
          action={<ClienteFormDialog trigger={<Button><Plus /> Cadastrar cliente</Button>} />}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Nome</TableHead>
                <TableHead>CPF / CNPJ</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Contato</TableHead>
                <TableHead className="text-center">Processos</TableHead>
                <TableHead className="hidden lg:table-cell">Desde</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium">{c.nome}</p>
                    {(c.cidade || c.uf) && (
                      <p className="text-xs text-muted-foreground" title={formatEnderecoLinha(c)}>
                        {[c.cidade, c.uf].filter(Boolean).join("/")}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{formatDocumento(c.documento)}</TableCell>
                  <TableCell>
                    <Badge variant={c.tipo === "Pessoa Jurídica" ? "andamento" : "muted"}>{c.tipo}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    <Contato cliente={c} />
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{c.processos?.[0]?.count ?? 0}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{formatDate(c.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <ClienteFormDialog
                        cliente={c}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label={`Editar ${c.nome}`}>
                            <Pencil />
                          </Button>
                        }
                      />
                      {canDelete && (
                        <ConfirmDelete
                          title="Excluir cliente?"
                          description={`"${c.nome}" será removido. Clientes com processos vinculados não podem ser excluídos.`}
                          onConfirm={() =>
                            del.mutateAsync(c.id).then(
                              () => toast.success("Cliente excluído."),
                              (e) => toast.error(friendlyError(e)),
                            )
                          }
                          trigger={
                            <Button variant="ghost" size="icon" aria-label={`Excluir ${c.nome}`} className="text-muted-foreground hover:text-destructive">
                              <Trash2 />
                            </Button>
                          }
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhum cliente encontrado para os filtros aplicados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">{filtrados.length} de {clientes.length} clientes</p>
    </PageContainer>
  );
}

function Contato({ cliente }: { cliente: Cliente }) {
  const telefones = parseTelefones(cliente.telefones);
  const whats = telefones.find((t) => t.whatsapp);
  const outro = telefones.find((t) => !t.whatsapp) ?? (cliente.telefone ? { numero: cliente.telefone } : undefined);
  if (!cliente.email && !telefones.length && !outro) return <>—</>;
  return (
    <div className="space-y-0.5">
      {cliente.email && <div className="truncate">{cliente.email}</div>}
      {whats && (
        <a
          href={whatsappLink(whats.numero)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
        >
          <MessageCircle className="size-3" /> {whats.numero}
        </a>
      )}
      {outro && (
        <div className="font-mono text-xs">
          {outro.numero}
          {telefones.length > (whats ? 2 : 1) ? ` +${telefones.length - (whats ? 2 : 1)}` : ""}
        </div>
      )}
    </div>
  );
}
