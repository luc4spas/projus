import { AlertTriangle, CheckCircle2, CircleDashed, Clock, Loader } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { descreverPrazo, urgenciaPrazo, type Urgencia } from "@/lib/prazos";
import { PAPEL_LABEL, type Papel } from "@/lib/domain";

const STATUS_VARIANT = {
  Pendente: "pendente",
  "Em Andamento": "andamento",
  Cumprido: "cumprido",
} as const;

export function StatusTarefaBadge({ status }: { status: string }) {
  const variant = STATUS_VARIANT[status as keyof typeof STATUS_VARIANT] ?? "muted";
  const Icon = status === "Cumprido" ? CheckCircle2 : status === "Em Andamento" ? Loader : CircleDashed;
  return (
    <Badge variant={variant}>
      <Icon className="size-3" />
      {status}
    </Badge>
  );
}

const URGENCIA_VARIANT: Record<Urgencia, "vencido" | "pendente" | "andamento" | "cumprido" | "muted"> = {
  vencido: "vencido",
  hoje: "vencido",
  proximo: "pendente",
  futuro: "muted",
  cumprido: "cumprido",
};

export function PrazoBadge({ dataFatal, status }: { dataFatal: string; status: string }) {
  const u = urgenciaPrazo(dataFatal, status);
  const Icon = u === "vencido" || u === "hoje" ? AlertTriangle : Clock;
  return (
    <Badge variant={URGENCIA_VARIANT[u]}>
      <Icon className="size-3" />
      {descreverPrazo(dataFatal, status)}
    </Badge>
  );
}

export function PapelBadge({ papel }: { papel: Papel }) {
  return <Badge variant={papel === "admin" ? "brass" : papel === "advogado" ? "andamento" : "muted"}>{PAPEL_LABEL[papel]}</Badge>;
}

export function FaseBadge({ fase, className }: { fase: string; className?: string }) {
  return (
    <Badge variant={fase === "Arquivado" ? "muted" : fase === "Suspenso" ? "pendente" : "outline"} className={className}>
      {fase}
    </Badge>
  );
}
