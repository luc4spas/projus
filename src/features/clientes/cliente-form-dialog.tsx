import { useEffect, useState, type ReactNode } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, MapPin, MessageCircle, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/common/field";
import { formatDocumento, isValidDocumento, onlyDigits } from "@/lib/documento";
import { formatTelefone, isValidTelefone, parseTelefones } from "@/lib/telefone";
import { TIPOS_CLIENTE } from "@/lib/domain";
import { buscarCEP, formatCEP, isValidCEP, UFS } from "@/lib/endereco";
import { friendlyError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { useSaveCliente, type Cliente } from "./api";

const schema = z
  .object({
    nome: z.string().trim().min(2, "Informe o nome").max(200),
    documento: z.string().refine(isValidDocumento, "CPF ou CNPJ inválido"),
    tipo: z.enum(TIPOS_CLIENTE),
    email: z.string().trim().email("E-mail inválido").max(255).or(z.literal("")),
    telefones: z
      .array(
        z.object({
          numero: z
            .string()
            .trim()
            .max(20)
            .refine((v) => !v || isValidTelefone(v), "Telefone incompleto"),
          whatsapp: z.boolean(),
        }),
      )
      .max(10),
    endereco: z.object({
      cep: z.string().refine((v) => !v || isValidCEP(v), "CEP deve ter 8 dígitos"),
      logradouro: z.string().trim().max(200),
      numero: z.string().trim().max(20),
      complemento: z.string().trim().max(120),
      bairro: z.string().trim().max(120),
      cidade: z.string().trim().max(120),
      uf: z.string().max(2),
    }),
  })
  .refine((v) => (v.tipo === "Pessoa Física" ? onlyDigits(v.documento).length === 11 : onlyDigits(v.documento).length === 14), {
    path: ["documento"],
    message: "Pessoa Física usa CPF; Pessoa Jurídica usa CNPJ",
  });

type FormValues = z.infer<typeof schema>;

const SEM_UF = "__none__";

const enderecoInicial = (c?: Cliente) => ({
  cep: formatCEP(c?.cep),
  logradouro: c?.logradouro ?? "",
  numero: c?.numero ?? "",
  complemento: c?.complemento ?? "",
  bairro: c?.bairro ?? "",
  cidade: c?.cidade ?? "",
  uf: c?.uf ?? "",
});

const telefonesIniciais = (cliente?: Cliente) => {
  const lista = cliente ? parseTelefones(cliente.telefones) : [];
  if (!lista.length && cliente?.telefone) lista.push({ numero: cliente.telefone, whatsapp: false });
  return lista.length ? lista.map((t) => ({ ...t, numero: formatTelefone(t.numero) })) : [{ numero: "", whatsapp: false }];
};

export function ClienteFormDialog({
  cliente,
  trigger,
  open: openProp,
  onOpenChange,
  onSaved,
}: {
  cliente?: Cliente;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (id: string) => void;
}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (v: boolean) => {
    setOpenState(v);
    onOpenChange?.(v);
  };
  const save = useSaveCliente();
  const [buscandoCep, setBuscandoCep] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", documento: "", tipo: "Pessoa Física", email: "", telefones: [{ numero: "", whatsapp: false }], endereco: enderecoInicial() },
  });
  const telefones = useFieldArray({ control: form.control, name: "telefones" });

  useEffect(() => {
    if (open) {
      form.reset({
        nome: cliente?.nome ?? "",
        documento: cliente ? formatDocumento(cliente.documento) : "",
        tipo: (cliente?.tipo as FormValues["tipo"]) ?? "Pessoa Física",
        email: cliente?.email ?? "",
        telefones: telefonesIniciais(cliente),
        endereco: enderecoInicial(cliente),
      });
    }
  }, [open, cliente, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const id = await save.mutateAsync({ id: cliente?.id, input: values });
      toast.success(cliente ? "Cliente atualizado." : "Cliente cadastrado.");
      setOpen(false);
      onSaved?.(id);
    } catch (e) {
      toast.error(friendlyError(e, "Não foi possível salvar o cliente."));
    }
  });

  const errors = form.formState.errors;
  const lista = form.watch("telefones");

  const preencherPorCep = async (cep: string) => {
    if (!isValidCEP(cep)) return;
    setBuscandoCep(true);
    const r = await buscarCEP(cep);
    setBuscandoCep(false);
    if (!r) {
      toast.info("CEP não encontrado. Preencha o endereço manualmente.");
      return;
    }
    const opts = { shouldDirty: true, shouldValidate: true };
    if (r.logradouro) form.setValue("endereco.logradouro", r.logradouro, opts);
    if (r.bairro) form.setValue("endereco.bairro", r.bairro, opts);
    if (r.cidade) form.setValue("endereco.cidade", r.cidade, opts);
    if (r.uf) form.setValue("endereco.uf", r.uf, opts);
    form.setFocus("endereco.numero");
  };

  const marcarWhatsapp = (index: number) => {
    const atual = form.getValues("telefones");
    const ativo = !atual[index]?.whatsapp;
    atual.forEach((_, i) => form.setValue(`telefones.${i}.whatsapp`, ativo && i === index, { shouldDirty: true }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{cliente ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>Dados de identificação usados nos processos do escritório.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.stopPropagation();
            onSubmit(e);
          }}
          className="grid gap-4 sm:grid-cols-2"
          noValidate
        >
          <Field label="Nome / Razão social" htmlFor="nome" error={errors.nome?.message} className="sm:col-span-2">
            <Input id="nome" {...form.register("nome")} />
          </Field>
          <Field label="Tipo" error={errors.tipo?.message}>
            <Controller
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CLIENTE.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="CPF / CNPJ" htmlFor="documento" error={errors.documento?.message}>
            <Controller
              control={form.control}
              name="documento"
              render={({ field }) => (
                <Input
                  id="documento"
                  inputMode="numeric"
                  className="font-mono"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(e) => {
                    const masked = formatDocumento(e.target.value);
                    field.onChange(masked);
                    const len = onlyDigits(masked).length;
                    if (len === 14) form.setValue("tipo", "Pessoa Jurídica");
                    else if (len === 11 && !cliente) form.setValue("tipo", "Pessoa Física");
                  }}
                />
              )}
            />
          </Field>
          <Field label="E-mail" htmlFor="email" error={errors.email?.message} className="sm:col-span-2">
            <Input id="email" type="email" {...form.register("email")} />
          </Field>

          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label>Telefones</Label>
              <span className="text-xs text-muted-foreground">Toque no ícone para marcar o WhatsApp</span>
            </div>
            {telefones.fields.map((f, index) => {
              const isWhats = !!lista[index]?.whatsapp;
              const erro = errors.telefones?.[index]?.numero?.message;
              return (
                <div key={f.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Controller
                      control={form.control}
                      name={`telefones.${index}.numero`}
                      render={({ field }) => (
                        <Input
                          aria-label={`Telefone ${index + 1}`}
                          inputMode="tel"
                          placeholder="(11) 91234-5678"
                          className="font-mono"
                          value={field.value}
                          onBlur={field.onBlur}
                          onChange={(e) => field.onChange(formatTelefone(e.target.value))}
                        />
                      )}
                    />
                    <Button
                      type="button"
                      variant={isWhats ? "default" : "outline"}
                      size="sm"
                      aria-pressed={isWhats}
                      onClick={() => marcarWhatsapp(index)}
                      className={cn("shrink-0", !isWhats && "text-muted-foreground")}
                    >
                      <MessageCircle /> WhatsApp
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover telefone ${index + 1}`}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        telefones.fields.length > 1 ? telefones.remove(index) : form.setValue(`telefones.${index}`, { numero: "", whatsapp: false })
                      }
                    >
                      <X />
                    </Button>
                  </div>
                  {erro && <p className="text-xs font-medium text-destructive">{erro}</p>}
                </div>
              );
            })}
            {telefones.fields.length < 10 && (
              <Button type="button" variant="outline" size="sm" onClick={() => telefones.append({ numero: "", whatsapp: false })}>
                <Plus /> Adicionar telefone
              </Button>
            )}
          </div>

          <fieldset className="grid gap-4 sm:col-span-2 sm:grid-cols-6">
            <legend className="mb-3 flex items-center gap-1.5 text-sm font-medium">
              <MapPin className="size-4 text-muted-foreground" /> Endereço
            </legend>
            <Field label="CEP" htmlFor="cep" error={errors.endereco?.cep?.message} className="sm:col-span-2" hint={buscandoCep ? "Buscando endereço…" : "Preenche o endereço automaticamente"}>
              <Controller
                control={form.control}
                name="endereco.cep"
                render={({ field }) => (
                  <Input
                    id="cep"
                    inputMode="numeric"
                    placeholder="00000-000"
                    className="font-mono"
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={(e) => {
                      const v = formatCEP(e.target.value);
                      field.onChange(v);
                      if (isValidCEP(v)) void preencherPorCep(v);
                    }}
                  />
                )}
              />
            </Field>
            <Field label="Logradouro" htmlFor="logradouro" className="sm:col-span-4">
              <Input id="logradouro" placeholder="Rua, avenida…" {...form.register("endereco.logradouro")} />
            </Field>
            <Field label="Número" htmlFor="numero" className="sm:col-span-2">
              <Input id="numero" {...form.register("endereco.numero")} />
            </Field>
            <Field label="Complemento" htmlFor="complemento" className="sm:col-span-4">
              <Input id="complemento" placeholder="Apto, sala, bloco…" {...form.register("endereco.complemento")} />
            </Field>
            <Field label="Bairro" htmlFor="bairro" className="sm:col-span-2">
              <Input id="bairro" {...form.register("endereco.bairro")} />
            </Field>
            <Field label="Cidade" htmlFor="cidade" className="sm:col-span-3">
              <Input id="cidade" {...form.register("endereco.cidade")} />
            </Field>
            <Field label="UF" className="sm:col-span-1">
              <Controller
                control={form.control}
                name="endereco.uf"
                render={({ field }) => (
                  <Select value={field.value || SEM_UF} onValueChange={(v) => field.onChange(v === SEM_UF ? "" : v)}>
                    <SelectTrigger aria-label="UF">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SEM_UF}>—</SelectItem>
                      {UFS.map((uf) => (
                        <SelectItem key={uf} value={uf}>
                          {uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </fieldset>

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {cliente ? "Salvar alterações" : "Cadastrar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
