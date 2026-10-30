import { useEffect, useRef, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, FileText, Loader2, Paperclip, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Field } from "@/components/common/field";
import { clientesQueryOptions } from "@/features/clientes/api";
import { ClienteCombobox } from "@/features/clientes/cliente-combobox";
import { processosQueryOptions } from "@/features/processos/api";
import { friendlyError } from "@/lib/errors";
import { formatBytes } from "@/lib/format";
import { processoLabel } from "@/lib/domain";
import { formatValorCampo, hojeDia, nomeComprovante, parseValor, STATUS_TRANSACAO, validarValor } from "@/lib/financeiro";
import { categoriasQueryOptions, MAX_COMPROVANTE_BYTES, useSaveTransacao, type Transacao } from "./api";
import { ComprovanteDialog } from "./componentes";

const schema = z
  .object({
    tipo: z.enum(["Receita", "Despesa"]),
    descricao: z.string().trim().min(2, "Descreva o lançamento").max(255),
    categoria_id: z.string().uuid("Escolha a categoria"),
    valor: z.string().superRefine((v, ctx) => {
      const msg = validarValor(v);
      if (msg) ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg });
    }),
    data_vencimento: z.string().min(1, "Informe o vencimento"),
    status: z.enum(STATUS_TRANSACAO),
    data_pagamento: z.string(),
    cliente_id: z.string(),
    processo_id: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.status === "Pago" && !v.data_pagamento) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["data_pagamento"], message: "Informe a data do pagamento" });
    }
  });

type FormValues = z.infer<typeof schema>;
const SEM_PROCESSO = "__none__";

export function TransacaoFormDialog({
  transacao,
  processoId,
  clienteId,
  trigger,
}: {
  transacao?: Transacao;
  /** Pré-vincula o lançamento a um processo (aba Financeiro do processo). */
  processoId?: string;
  clienteId?: string | null;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [remover, setRemover] = useState(false);
  const [verComprovante, setVerComprovante] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const save = useSaveTransacao();
  const { data: categorias = [] } = useQuery({ ...categoriasQueryOptions(), enabled: open });
  const { data: clientes = [] } = useQuery({ ...clientesQueryOptions(), enabled: open });
  const { data: processos = [] } = useQuery({ ...processosQueryOptions(), enabled: open });

  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    setArquivo(null);
    setRemover(false);
    form.reset({
      tipo: (transacao?.tipo as FormValues["tipo"]) ?? "Receita",
      descricao: transacao?.descricao ?? "",
      categoria_id: transacao?.categoria_id ?? "",
      valor: transacao ? formatValorCampo(Number(transacao.valor)) : "",
      data_vencimento: transacao?.data_vencimento ?? hojeDia(),
      status: (transacao?.status as FormValues["status"]) ?? "Pendente",
      data_pagamento: transacao?.data_pagamento ?? "",
      cliente_id: transacao?.cliente_id ?? clienteId ?? "",
      processo_id: transacao?.processo_id ?? processoId ?? "",
    });
  }, [open, transacao, processoId, clienteId, form]);

  const errors = form.formState.errors;
  const tipo = form.watch("tipo");
  const status = form.watch("status");
  const clienteSel = form.watch("cliente_id");
  const categoriasDoTipo = categorias.filter((c) => c.tipo === tipo);
  const processosDoCliente = clienteSel ? processos.filter((p) => p.cliente_id === clienteSel) : processos;
  const comprovanteAtual = transacao?.comprovante_url && !remover ? transacao.comprovante_url : null;

  function escolherArquivo(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_COMPROVANTE_BYTES) {
      toast.error("O comprovante deve ter no máximo 20 MB.");
      return;
    }
    setArquivo(file);
  }

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      await save.mutateAsync({
        id: transacao?.id,
        input: {
          tipo: v.tipo,
          descricao: v.descricao,
          categoria_id: v.categoria_id,
          valor: parseValor(v.valor) ?? 0,
          data_vencimento: v.data_vencimento,
          data_pagamento: v.status === "Pago" ? v.data_pagamento : null,
          status: v.status,
          cliente_id: v.cliente_id || null,
          processo_id: v.processo_id || null,
        },
        arquivo,
        removerComprovante: remover,
        comprovanteAtual: transacao?.comprovante_url ?? null,
      });
      toast.success(transacao ? "Lançamento atualizado." : "Lançamento registrado.");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error && e.message.includes("20 MB") ? e.message : friendlyError(e, "Não foi possível salvar o lançamento."));
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{transacao ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
          <DialogDescription>Receitas e despesas do escritório, com vínculo opcional a cliente e processo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Tipo" className="sm:col-span-2">
            <Controller
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <ToggleGroup
                  type="single"
                  variant="outline"
                  className="justify-start"
                  value={field.value}
                  onValueChange={(v) => {
                    if (!v) return;
                    field.onChange(v);
                    form.setValue("categoria_id", "");
                  }}
                >
                  <ToggleGroupItem value="Receita" className="px-5 data-[state=on]:bg-status-cumprido-soft data-[state=on]:text-status-cumprido">
                    Receita
                  </ToggleGroupItem>
                  <ToggleGroupItem value="Despesa" className="px-5 data-[state=on]:bg-status-vencido-soft data-[state=on]:text-status-vencido">
                    Despesa
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            />
          </Field>

          <Field label="Descrição" htmlFor="descricao" error={errors.descricao?.message} className="sm:col-span-2">
            <Input id="descricao" placeholder="Ex.: Honorários iniciais — parcela 1/3" maxLength={255} {...form.register("descricao")} />
          </Field>

          <Field label="Categoria" error={errors.categoria_id?.message}>
            <Controller
              control={form.control}
              name="categoria_id"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.categoria_id || undefined} aria-label="Categoria">
                    <SelectValue placeholder="Escolha a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasDoTipo.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Valor (R$)" htmlFor="valor" error={errors.valor?.message}>
            <Controller
              control={form.control}
              name="valor"
              render={({ field }) => (
                <Input
                  id="valor"
                  inputMode="decimal"
                  placeholder="0,00"
                  className="tabular-nums"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={() => {
                    const n = parseValor(field.value ?? "");
                    if (n != null && n > 0) field.onChange(formatValorCampo(n));
                    field.onBlur();
                  }}
                />
              )}
            />
          </Field>

          <Field label="Vencimento" htmlFor="data_vencimento" error={errors.data_vencimento?.message}>
            <Input id="data_vencimento" type="date" {...form.register("data_vencimento")} />
          </Field>

          <Field
            label="Status"
            hint={status === "Pendente" ? "Pendente com vencimento passado aparece como Atrasado." : undefined}
          >
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    if (v === "Pago" && !form.getValues("data_pagamento")) form.setValue("data_pagamento", hojeDia());
                  }}
                >
                  <SelectTrigger aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_TRANSACAO.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {status === "Pago" && (
            <Field label="Data do pagamento" htmlFor="data_pagamento" error={errors.data_pagamento?.message}>
              <Input id="data_pagamento" type="date" {...form.register("data_pagamento")} />
            </Field>
          )}

          <Field label="Cliente (opcional)" className={status === "Pago" ? "" : "sm:col-span-2"}>
            <Controller
              control={form.control}
              name="cliente_id"
              render={({ field }) => (
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <ClienteCombobox
                      clientes={clientes}
                      value={field.value}
                      onChange={(id) => {
                        field.onChange(id);
                        const proc = processos.find((p) => p.id === form.getValues("processo_id"));
                        if (proc && proc.cliente_id !== id) form.setValue("processo_id", "");
                      }}
                    />
                  </div>
                  {field.value && (
                    <Button type="button" variant="ghost" size="icon" aria-label="Remover cliente" onClick={() => field.onChange("")}>
                      <X />
                    </Button>
                  )}
                </div>
              )}
            />
          </Field>

          <Field label="Processo (opcional)" className="sm:col-span-2" hint="Custas, honorários sucumbenciais e outros valores do caso.">
            <Controller
              control={form.control}
              name="processo_id"
              render={({ field }) => (
                <Select
                  value={field.value || SEM_PROCESSO}
                  onValueChange={(v) => {
                    const id = v === SEM_PROCESSO ? "" : v;
                    field.onChange(id);
                    const proc = processos.find((p) => p.id === id);
                    if (proc?.cliente_id) form.setValue("cliente_id", proc.cliente_id);
                  }}
                >
                  <SelectTrigger aria-label="Processo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_PROCESSO}>Sem processo vinculado</SelectItem>
                    {processosDoCliente.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {processoLabel(p)}
                        {p.cliente ? ` · ${p.cliente.nome}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Comprovante (opcional)" className="sm:col-span-2" hint="PDF ou imagem, até 20 MB.">
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept="application/pdf,image/*"
              aria-label="Arquivo do comprovante"
              onChange={(e) => {
                escolherArquivo(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {arquivo || comprovanteAtual ? (
              <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{arquivo ? arquivo.name : nomeComprovante(comprovanteAtual)}</p>
                  <p className="text-xs text-muted-foreground">{arquivo ? `${formatBytes(arquivo.size)} · será enviado ao salvar` : "Arquivo anexado"}</p>
                </div>
                {!arquivo && comprovanteAtual && (
                  <Button type="button" variant="ghost" size="icon" aria-label="Visualizar comprovante" onClick={() => setVerComprovante(comprovanteAtual)}>
                    <Eye />
                  </Button>
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                  Trocar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remover comprovante"
                  onClick={() => {
                    if (arquivo) setArquivo(null);
                    else setRemover(true);
                  }}
                >
                  <X />
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" className="w-full justify-start" onClick={() => inputRef.current?.click()}>
                <Paperclip /> Anexar comprovante
              </Button>
            )}
          </Field>

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {transacao ? "Salvar alterações" : "Registrar lançamento"}
            </Button>
          </DialogFooter>
        </form>
        <ComprovanteDialog path={verComprovante} onOpenChange={(o) => !o && setVerComprovante(null)} />
      </DialogContent>
    </Dialog>
  );
}
