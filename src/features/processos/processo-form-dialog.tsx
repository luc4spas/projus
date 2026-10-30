import { useEffect, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/common/field";
import { formatCNJ, isValidCNJ } from "@/lib/documento";
import { FASES_PROCESSO, SISTEMAS_PROCESSUAIS } from "@/lib/domain";
import { Textarea } from "@/components/ui/textarea";
import { friendlyError } from "@/lib/errors";
import { clientesQueryOptions } from "@/features/clientes/api";
import { useEquipeMap } from "@/features/equipe/api";
import { ClienteCombobox } from "@/features/clientes/cliente-combobox";
import { ClienteFormDialog } from "@/features/clientes/cliente-form-dialog";
import { usePermissions } from "@/features/auth/use-current-user";
import { useSaveProcesso, type Processo } from "./api";

const schema = z.object({
  titulo: z.string().trim().min(3, "Informe o título do processo").max(200),
  numero_cnj: z.string().refine((v) => !v || isValidCNJ(v), "Número CNJ deve ter 20 dígitos"),
  cliente_id: z.string().uuid("Selecione o cliente"),
  tribunal: z.string().trim().max(120),
  comarca: z.string().trim().max(120),
  vara: z.string().trim().max(160),
  fase_atual: z.string().min(1),
  valor_causa: z.string().trim().max(20),
  advogado_responsavel: z.string().uuid("Selecione o advogado responsável"),
  sistema: z.string().max(60),
  descricao_acao: z.string().trim().max(8000),
});

const SEM_SISTEMA = "__none__";
type FormValues = z.infer<typeof schema>;

const parseValor = (v: string) => {
  if (!v) return null;
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export function ProcessoFormDialog({ processo, trigger }: { processo?: Processo; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [novoCliente, setNovoCliente] = useState(false);
  const navigate = useNavigate();
  const { user, canAssignAnyLawyer } = usePermissions();
  const { staff } = useEquipeMap();
  const { data: clientes = [] } = useQuery({ ...clientesQueryOptions(), enabled: open });
  const save = useSaveProcesso();

  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    form.reset({
      titulo: processo?.titulo ?? "",
      numero_cnj: processo?.numero_cnj ?? "",
      cliente_id: processo?.cliente_id ?? "",
      tribunal: processo?.tribunal ?? "",
      comarca: processo?.comarca ?? "",
      vara: processo?.vara ?? "",
      fase_atual: processo?.fase_atual ?? "Conhecimento",
      valor_causa: processo?.valor_causa != null ? String(processo.valor_causa).replace(".", ",") : "",
      advogado_responsavel: processo?.advogado_responsavel ?? user.id,
      sistema: processo?.sistema ?? "",
      descricao_acao: processo?.descricao_acao ?? "",
    });
  }, [open, processo, form, user.id]);

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      const id = await save.mutateAsync({
        id: processo?.id,
        input: {
          titulo: v.titulo,
          numero_cnj: v.numero_cnj || null,
          cliente_id: v.cliente_id,
          tribunal: v.tribunal,
          comarca: v.comarca,
          vara: v.vara,
          fase_atual: v.fase_atual,
          valor_causa: parseValor(v.valor_causa),
          advogado_responsavel: canAssignAnyLawyer ? v.advogado_responsavel : user.id,
          sistema: v.sistema || null,
          descricao_acao: v.descricao_acao,
        },
      });
      toast.success(processo ? "Processo atualizado." : "Processo cadastrado.");
      setOpen(false);
      if (!processo) navigate({ to: "/processos/$processoId", params: { processoId: id } });
    } catch (e) {
      toast.error(friendlyError(e, "Não foi possível salvar o processo."));
    }
  });

  const errors = form.formState.errors;
  const advogados = staff.length ? staff : [{ id: user.id, nome: user.nome }];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{processo ? "Editar processo" : "Novo processo"}</DialogTitle>
          <DialogDescription>Informações do caso conforme a distribuição no tribunal.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Título do processo" htmlFor="titulo" error={errors.titulo?.message} className="sm:col-span-2">
            <Input id="titulo" placeholder="Ex.: Ação de cobrança — Empresa X" {...form.register("titulo")} />
          </Field>
          <Field label="Número CNJ (opcional)" htmlFor="numero_cnj" error={errors.numero_cnj?.message} hint="NNNNNNN-DD.AAAA.J.TR.OOOO">
            <Controller
              control={form.control}
              name="numero_cnj"
              render={({ field }) => (
                <Input
                  id="numero_cnj"
                  className="font-mono"
                  inputMode="numeric"
                  value={field.value ?? ""}
                  onBlur={field.onBlur}
                  onChange={(e) => field.onChange(formatCNJ(e.target.value))}
                />
              )}
            />
          </Field>
          <Field label="Cliente" error={errors.cliente_id?.message}>
            <Controller
              control={form.control}
              name="cliente_id"
              render={({ field }) => (
                <ClienteCombobox
                  clientes={clientes}
                  value={field.value || ""}
                  onChange={field.onChange}
                  onNovoCliente={() => setNovoCliente(true)}
                  invalid={!!errors.cliente_id}
                />
              )}
            />
          </Field>
          <Field label="Tribunal" htmlFor="tribunal">
            <Input id="tribunal" placeholder="Ex.: TJSP" {...form.register("tribunal")} />
          </Field>
          <Field label="Comarca" htmlFor="comarca">
            <Input id="comarca" placeholder="Ex.: São Paulo" {...form.register("comarca")} />
          </Field>
          <Field label="Vara" htmlFor="vara">
            <Input id="vara" placeholder="Ex.: 3ª Vara Cível" {...form.register("vara")} />
          </Field>
          <Field label="Sistema">
            <Controller
              control={form.control}
              name="sistema"
              render={({ field }) => {
                const opcoes: string[] = [...SISTEMAS_PROCESSUAIS];
                if (field.value && !opcoes.includes(field.value)) opcoes.unshift(field.value);
                return (
                  <Select value={field.value || SEM_SISTEMA} onValueChange={(v) => field.onChange(v === SEM_SISTEMA ? "" : v)}>
                    <SelectTrigger aria-label="Sistema">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SEM_SISTEMA}>Não informado</SelectItem>
                      {opcoes.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }}
            />
          </Field>
          <Field label="Fase atual">
            <Controller
              control={form.control}
              name="fase_atual"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FASES_PROCESSO.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Valor da causa (R$)" htmlFor="valor_causa">
            <Input id="valor_causa" inputMode="decimal" placeholder="0,00" {...form.register("valor_causa")} />
          </Field>
          <Field
            label="Advogado responsável"
            error={errors.advogado_responsavel?.message}
            hint={canAssignAnyLawyer ? undefined : "Você será o responsável por este processo."}
          >
            <Controller
              control={form.control}
              name="advogado_responsavel"
              render={({ field }) => (
                <Select value={field.value || ""} onValueChange={field.onChange} disabled={!canAssignAnyLawyer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {advogados.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Descrição da ação" htmlFor="descricao_acao" className="sm:col-span-2" hint="Objeto da ação, pedidos e resumo dos fatos.">
            <Textarea id="descricao_acao" rows={3} {...form.register("descricao_acao")} />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {processo ? "Salvar alterações" : "Cadastrar processo"}
            </Button>
          </DialogFooter>
        </form>
        <ClienteFormDialog
          open={novoCliente}
          onOpenChange={setNovoCliente}
          onSaved={(id) => form.setValue("cliente_id", id, { shouldValidate: true })}
        />
      </DialogContent>
    </Dialog>
  );
}
