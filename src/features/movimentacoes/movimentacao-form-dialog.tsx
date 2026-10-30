import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/common/field";
import { friendlyError } from "@/lib/errors";
import { hojeISO, MAX_DESCRICAO_MOVIMENTACAO, validarDataMovimentacao } from "@/lib/movimentacoes";
import { useSaveMovimentacao, type Movimentacao } from "./api";

const schema = z.object({
  data: z.string().superRefine((v, ctx) => {
    const erro = validarDataMovimentacao(v);
    if (erro) ctx.addIssue({ code: "custom", message: erro });
  }),
  descricao: z
    .string()
    .trim()
    .min(1, "Descreva a movimentação")
    .max(MAX_DESCRICAO_MOVIMENTACAO, "Texto muito longo"),
});
type FormValues = z.infer<typeof schema>;

export function MovimentacaoFormDialog({
  processoId,
  movimentacao,
  open,
  onOpenChange,
}: {
  processoId: string;
  movimentacao?: Movimentacao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const save = useSaveMovimentacao(processoId);
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    form.reset({
      data: movimentacao?.data_movimentacao ?? hojeISO(),
      descricao: movimentacao?.descricao ?? "",
    });
  }, [open, movimentacao, form]);

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      await save.mutateAsync({ id: movimentacao?.id, data: v.data, descricao: v.descricao });
      toast.success(movimentacao ? "Movimentação atualizada." : "Movimentação registrada.");
      onOpenChange(false);
    } catch (e) {
      toast.error(friendlyError(e, "Não foi possível salvar a movimentação."));
    }
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{movimentacao ? "Editar movimentação" : "Nova movimentação"}</DialogTitle>
          <DialogDescription>Registre o que aconteceu no processo e em que data.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <Field label="Data" htmlFor="mov-data" error={errors.data?.message}>
            <Input id="mov-data" type="date" max={hojeISO()} className="w-48" {...form.register("data")} />
          </Field>
          <Field label="Descrição" htmlFor="mov-descricao" error={errors.descricao?.message} hint="Ex.: Juntada de contestação; audiência designada para 10/11.">
            <Textarea id="mov-descricao" rows={5} {...form.register("descricao")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {movimentacao ? "Salvar alterações" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
