import { useEffect, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/common/field";
import { processoLabel, STATUS_TAREFA } from "@/lib/domain";
import { friendlyError } from "@/lib/errors";
import { toDateTimeLocal } from "@/lib/format";
import { processosQueryOptions } from "@/features/processos/api";
import { useEquipeMap } from "@/features/equipe/api";
import { usePermissions } from "@/features/auth/use-current-user";
import { useSaveTarefa, type Tarefa } from "./api";

const SEM_PROCESSO = "__none__";

const schema = z.object({
  titulo: z.string().trim().min(2, "Informe o título").max(200),
  descricao: z.string().trim().max(4000),
  processo_id: z.string(),
  responsavel_id: z.string().uuid("Selecione o responsável"),
  data_fatal: z.string().min(1, "Informe a data fatal"),
  status: z.enum(STATUS_TAREFA),
});
type FormValues = z.infer<typeof schema>;

export function TarefaFormDialog({
  tarefa,
  processoId,
  dataInicial,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  tarefa?: Tarefa | undefined;
  processoId?: string;
  /** Dia sugerido para novas tarefas (ex.: ao clicar num dia da agenda). */
  dataInicial?: Date;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const setOpen = onOpenChange ?? setInnerOpen;
  const { user } = usePermissions();
  const { staff } = useEquipeMap();
  const { data: processos = [] } = useQuery({ ...processosQueryOptions(), enabled: open });
  const save = useSaveTarefa();
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    const defaultDate = dataInicial ? new Date(dataInicial) : new Date();
    if (!dataInicial) defaultDate.setDate(defaultDate.getDate() + 5);
    defaultDate.setHours(18, 0, 0, 0);
    form.reset({
      titulo: tarefa?.titulo ?? "",
      descricao: tarefa?.descricao ?? "",
      processo_id: tarefa?.processo_id ?? processoId ?? SEM_PROCESSO,
      responsavel_id: tarefa?.responsavel_id ?? user.id,
      data_fatal: toDateTimeLocal(tarefa?.data_fatal ?? defaultDate),
      status: (tarefa?.status as FormValues["status"]) ?? "Pendente",
    });
  }, [open, tarefa, processoId, dataInicial, form, user.id]);

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      await save.mutateAsync({
        id: tarefa?.id,
        input: {
          titulo: v.titulo,
          descricao: v.descricao,
          processo_id: v.processo_id === SEM_PROCESSO ? null : v.processo_id,
          responsavel_id: v.responsavel_id,
          data_fatal: new Date(v.data_fatal).toISOString(),
          status: v.status,
        },
      });
      toast.success(tarefa ? "Tarefa atualizada." : "Tarefa criada e atribuída.");
      setOpen(false);
    } catch (e) {
      toast.error(friendlyError(e, "Não foi possível salvar a tarefa."));
    }
  });

  const errors = form.formState.errors;
  const membros = staff.length ? staff : [{ id: user.id, nome: user.nome }];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{tarefa ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
          <DialogDescription>Defina o prazo fatal e quem da equipe ficará responsável.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Título" htmlFor="titulo" error={errors.titulo?.message} className="sm:col-span-2">
            <Input id="titulo" placeholder="Ex.: Protocolar contestação" {...form.register("titulo")} />
          </Field>
          <Field label="Descrição" htmlFor="descricao" className="sm:col-span-2">
            <Textarea id="descricao" rows={3} {...form.register("descricao")} />
          </Field>
          <Field label="Processo vinculado" className="sm:col-span-2">
            <Controller
              control={form.control}
              name="processo_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!!processoId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_PROCESSO}>Sem processo (tarefa interna)</SelectItem>
                    {processos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span>{processoLabel(p)}</span>
                        {p.cliente?.nome ? ` · ${p.cliente.nome}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Responsável" error={errors.responsavel_id?.message}>
            <Controller
              control={form.control}
              name="responsavel_id"
              render={({ field }) => (
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {membros.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome}
                        {m.id === user.id ? " (você)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Data fatal" htmlFor="data_fatal" error={errors.data_fatal?.message}>
            <Input id="data_fatal" type="datetime-local" {...form.register("data_fatal")} />
          </Field>
          <Field label="Status">
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_TAREFA.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {tarefa ? "Salvar alterações" : "Criar tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
