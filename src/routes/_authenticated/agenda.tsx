import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageContainer, PageHeader, PageSkeleton } from "@/components/common/page";
import { tarefasQueryOptions } from "@/features/tarefas/api";
import { equipeQueryOptions, useEquipeMap } from "@/features/equipe/api";
import { useCurrentUser } from "@/features/auth/use-current-user";
import { CalendarioMensal } from "@/features/agenda/calendario-mensal";
import { tituloPagina } from "@/lib/marca";

const DESCRICAO = "Calendário mensal com os prazos e tarefas da equipe, sincronizado com o quadro de tarefas.";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: ({ match }) => ({
    meta: [
      { title: tituloPagina("Agenda", match.context.marca) },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: tituloPagina("Agenda", match.context.marca) },
      { property: "og:description", content: DESCRICAO },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(tarefasQueryOptions()),
      context.queryClient.ensureQueryData(equipeQueryOptions()),
    ]),
  pendingComponent: () => <PageSkeleton variant="kanban" />,
  component: AgendaPage,
});

function AgendaPage() {
  const user = useCurrentUser();
  const { data: tarefas } = useSuspenseQuery(tarefasQueryOptions());
  const { staff } = useEquipeMap();
  const [responsavel, setResponsavel] = useState("todos");
  const [mostrarCumpridas, setMostrarCumpridas] = useState(true);

  const filtradas = useMemo(
    () =>
      tarefas.filter(
        (t) =>
          (responsavel === "todos" || t.responsavel_id === (responsavel === "eu" ? user.id : responsavel)) &&
          (mostrarCumpridas || t.status !== "Cumprido"),
      ),
    [tarefas, responsavel, mostrarCumpridas, user.id],
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Escritório"
        title="Agenda"
        description="Os mesmos prazos e tarefas do quadro, organizados por dia. Clique num compromisso para editar ou num dia para agendar."
        actions={
          <>
            <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5">
              <Switch id="cumpridas" checked={mostrarCumpridas} onCheckedChange={setMostrarCumpridas} />
              <Label htmlFor="cumpridas" className="text-sm font-normal">
                Mostrar cumpridas
              </Label>
            </div>
            <Select value={responsavel} onValueChange={setResponsavel}>
              <SelectTrigger className="w-52" aria-label="Responsável">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os responsáveis</SelectItem>
                <SelectItem value="eu">Minha agenda</SelectItem>
                {staff
                  .filter((m) => m.id !== user.id)
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </>
        }
      />
      <CalendarioMensal tarefas={filtradas} />
    </PageContainer>
  );
}
