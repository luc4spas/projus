import { useEffect, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/common/field";
import { PAPEL_LABEL, type Papel } from "@/lib/domain";
import { SENHA_MINIMA } from "@/lib/usuarios";
import { erroUsuario, useAtualizarUsuario, useCriarUsuario, type MembroEquipe } from "./api";

const PAPEIS: Papel[] = ["admin", "advogado", "cliente"];

const schema = z.object({
  nome: z.string().trim().min(2, "Informe o nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  papel: z.enum(["admin", "advogado", "cliente"]),
  senha: z.string().max(72),
});
type FormValues = z.infer<typeof schema>;

export function UsuarioFormDialog({
  membro,
  proprio = false,
  trigger,
}: {
  membro?: MembroEquipe;
  /** Editando a própria conta: o papel fica travado. */
  proprio?: boolean;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [verSenha, setVerSenha] = useState(false);
  const criar = useCriarUsuario();
  const atualizar = useAtualizarUsuario();
  const pending = criar.isPending || atualizar.isPending;
  const form = useForm<FormValues>({
    resolver: zodResolver(
      schema.refine((v) => (membro ? !v.senha || v.senha.length >= SENHA_MINIMA : v.senha.length >= SENHA_MINIMA), {
        path: ["senha"],
        message: `A senha deve ter pelo menos ${SENHA_MINIMA} caracteres`,
      }),
    ),
  });

  useEffect(() => {
    if (!open) return;
    setVerSenha(false);
    form.reset({
      nome: membro?.nome ?? "",
      email: membro?.email ?? "",
      papel: membro?.papel ?? "advogado",
      senha: "",
    });
  }, [open, membro, form]);

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      if (membro) {
        await atualizar.mutateAsync({ id: membro.id, nome: v.nome, email: v.email, papel: v.papel, senha: v.senha });
        toast.success("Usuário atualizado.");
      } else {
        await criar.mutateAsync({ nome: v.nome, email: v.email, papel: v.papel, senha: v.senha });
        toast.success(`Conta de ${v.nome} criada. Envie o e-mail e a senha para a pessoa entrar.`);
      }
      setOpen(false);
    } catch (e) {
      toast.error(erroUsuario(e, "Não foi possível salvar o usuário."));
    }
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{membro ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          <DialogDescription>
            {membro
              ? "Altere os dados de acesso. Deixe a senha em branco para mantê-la."
              : "A conta já nasce confirmada: a pessoa entra com este e-mail e senha."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Nome" htmlFor="u-nome" error={errors.nome?.message} className="sm:col-span-2">
            <Input id="u-nome" autoComplete="off" {...form.register("nome")} />
          </Field>
          <Field label="E-mail" htmlFor="u-email" error={errors.email?.message} className="sm:col-span-2">
            <Input id="u-email" type="email" autoComplete="off" {...form.register("email")} />
          </Field>
          <Field
            label={membro ? "Nova senha (opcional)" : "Senha"}
            htmlFor="u-senha"
            error={errors.senha?.message}
            hint={`Mínimo de ${SENHA_MINIMA} caracteres.`}
          >
            <div className="relative">
              <Input id="u-senha" type={verSenha ? "text" : "password"} autoComplete="new-password" className="pr-10" {...form.register("senha")} />
              <button
                type="button"
                onClick={() => setVerSenha((s) => !s)}
                aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {verSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
          <Field label="Papel" hint={proprio ? "Você não pode alterar o próprio papel." : undefined}>
            <Controller
              control={form.control}
              name="papel"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={proprio}>
                  <SelectTrigger>
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
            />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {membro ? "Salvar alterações" : "Criar usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
