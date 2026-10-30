import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { tituloPagina } from "@/lib/marca";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Briefcase, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageContainer, PageHeader, PageSkeleton } from "@/components/common/page";
import { FaseBadge } from "@/components/common/status-badges";
import { processosQueryOptions, type ProcessoComCliente } from "@/features/processos/api";
import { ProcessoFormDialog } from "@/features/processos/processo-form-dialog";
import { equipeQueryOptions, useEquipeMap } from "@/features/equipe/api";
import { FASES_PROCESSO, isProcessoAtivo, processoLabel } from "@/lib/domain";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/processos/")({
  head: ({ match }) => ({
    meta: [
      { title: tituloPagina("Processos", match.context.marca) },
      { name: "description", content: "Processos do escritório com tribunal, fase, valor da causa e responsável." },
      { property: "og:title", content: tituloPagina("Processos", match.context.marca) },
      { property: "og:description", content: "Processos do escritório com tribunal, fase, valor da causa e responsável." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(processosQueryOptions()),
      context.queryClient.ensureQueryData(equipeQueryOptions()),
    ]),
  pendingComponent: () => <PageSkeleton />,
  component: ProcessosPage,
});

type SortKey = "titulo" | "cliente" | "tribunal" | "fase_atual" | "valor_causa";
const PAGE_SIZE = 12;

function sortValue(p: ProcessoComCliente, key: SortKey): string | number {
  if (key === "cliente") return p.cliente?.nome ?? "";
  if (key === "valor_causa") return p.valor_causa ?? -1;
  if (key === "titulo") return processoLabel(p);
  return (p[key] ?? "") as string;
}

function ProcessosPage() {
  const { data: processos } = useSuspenseQuery(processosQueryOptions());
  const { map } = useEquipeMap();
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [fase, setFase] = useState("ativos");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    let list = processos.filter((p) => {
      if (fase === "ativos" && !isProcessoAtivo(p.fase_atual)) return false;
      if (fase !== "ativos" && fase !== "todas" && p.fase_atual !== fase) return false;
      if (!q) return true;
      return [p.titulo, p.numero_cnj, p.cliente?.nome, p.tribunal, p.comarca, p.vara].some((v) => v?.toLowerCase().includes(q));
    });
    if (sort) {
      list = [...list].sort((a, b) => {
        const va = sortValue(a, sort.key);
        const vb = sortValue(b, sort.key);
        return (typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "pt-BR")) * sort.dir;
      });
    }
    return list;
  }, [processos, busca, fase, sort]);

  const pageCount = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const visiveis = filtrados.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s?.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null));

  const SortHead = ({ k, children, className }: { k: SortKey; children: string; className?: string }) => (
    <TableHead className={className}>
      <button type="button" onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-foreground">
        {children}
        {sort?.key === k ? sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-40" />}
      </button>
    </TableHead>
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Contencioso"
        title="Processos e pastas digitais"
        description="Clique em um processo para ver os detalhes do caso, a pasta digital e os prazos vinculados."
        actions={
          <ProcessoFormDialog
            trigger={
              <Button>
                <Plus /> Novo processo
              </Button>
            }
          />
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar por título, número CNJ, cliente, tribunal ou vara"
            className="pl-9"
          />
        </div>
        <Select
          value={fase}
          onValueChange={(v) => {
            setFase(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativos">Somente ativos</SelectItem>
            <SelectItem value="todas">Todas as fases</SelectItem>
            {FASES_PROCESSO.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {processos.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Nenhum processo visível"
          description="Cadastre um processo ou peça a um administrador para atribuí-lo a você."
          action={<ProcessoFormDialog trigger={<Button><Plus /> Cadastrar processo</Button>} />}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <SortHead k="titulo">Processo</SortHead>
                <SortHead k="cliente">Cliente</SortHead>
                <SortHead k="tribunal" className="hidden md:table-cell">Tribunal / Comarca</SortHead>
                <SortHead k="fase_atual">Fase</SortHead>
                <SortHead k="valor_causa" className="hidden text-right lg:table-cell">Valor da causa</SortHead>
                <TableHead className="hidden xl:table-cell">Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((p) => (
                <TableRow
                  key={p.id}
                  tabIndex={0}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/processos/$processoId", params: { processoId: p.id } })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") navigate({ to: "/processos/$processoId", params: { processoId: p.id } });
                  }}
                >
                  <TableCell className="max-w-72">
                    <div className="truncate font-medium text-primary">{processoLabel(p)}</div>
                    {p.titulo && p.numero_cnj && <div className="font-mono text-xs text-muted-foreground">{p.numero_cnj}</div>}
                    {!p.numero_cnj && <div className="text-xs text-muted-foreground">Sem número CNJ</div>}
                  </TableCell>
                  <TableCell className="font-medium">{p.cliente?.nome ?? "—"}</TableCell>
                  <TableCell className="hidden text-sm md:table-cell">
                    <div>{p.tribunal || "—"}</div>
                    <div className="text-xs text-muted-foreground">{[p.comarca, p.vara].filter(Boolean).join(" · ")}</div>
                  </TableCell>
                  <TableCell>
                    <FaseBadge fase={p.fase_atual} />
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">{formatCurrency(p.valor_causa)}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
                    {(p.advogado_responsavel && map.get(p.advogado_responsavel)?.nome) || "—"}
                  </TableCell>
                </TableRow>
              ))}
              {visiveis.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhum processo encontrado para os filtros aplicados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {processos.length > 0 && (
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{filtrados.length} processo(s)</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="size-8" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Página anterior">
              <ChevronLeft />
            </Button>
            <span>
              Página {current + 1} de {pageCount}
            </span>
            <Button variant="outline" size="icon" className="size-8" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)} aria-label="Próxima página">
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
