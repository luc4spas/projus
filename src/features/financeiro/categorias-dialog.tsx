import { useState, type FormEvent, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { friendlyError } from "@/lib/errors";
import { TIPOS_TRANSACAO } from "@/lib/financeiro";
import { categoriasQueryOptions, useDeleteCategoria, useSaveCategoria, type Categoria } from "./api";

/** Cadastro das categorias de receita e despesa (somente administrador). */
export function CategoriasDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: categorias = [], isLoading } = useQuery({ ...categoriasQueryOptions(), enabled: open });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Categorias financeiras</DialogTitle>
          <DialogDescription>Categorias em uso por algum lançamento não podem ser excluídas.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <Skeleton className="h-48" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {TIPOS_TRANSACAO.map((tipo) => (
              <ListaCategorias key={tipo} tipo={tipo} categorias={categorias.filter((c) => c.tipo === tipo)} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ListaCategorias({ tipo, categorias }: { tipo: string; categorias: Categoria[] }) {
  const save = useSaveCategoria();
  const [nova, setNova] = useState("");

  async function adicionar(e: FormEvent) {
    e.preventDefault();
    if (!nova.trim()) return;
    try {
      await save.mutateAsync({ nome: nova, tipo });
      setNova("");
    } catch (err) {
      toast.error(friendlyError(err));
    }
  }

  return (
    <section>
      <p className="eyebrow mb-2">{tipo === "Receita" ? "Receitas" : "Despesas"}</p>
      <ul className="divide-y rounded-md border">
        {categorias.map((c) => (
          <ItemCategoria key={c.id} categoria={c} />
        ))}
        {categorias.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">Nenhuma categoria.</li>}
      </ul>
      <form onSubmit={adicionar} className="mt-2 flex gap-2">
        <Input value={nova} onChange={(e) => setNova(e.target.value)} placeholder="Nova categoria" maxLength={80} aria-label={`Nova categoria de ${tipo}`} />
        <Button type="submit" size="icon" variant="outline" aria-label={`Adicionar categoria de ${tipo}`} disabled={save.isPending || !nova.trim()}>
          {save.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
        </Button>
      </form>
    </section>
  );
}

function ItemCategoria({ categoria }: { categoria: Categoria }) {
  const save = useSaveCategoria();
  const del = useDeleteCategoria();
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(categoria.nome);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim() || nome.trim() === categoria.nome) return setEditando(false);
    try {
      await save.mutateAsync({ id: categoria.id, nome, tipo: categoria.tipo });
      setEditando(false);
    } catch (err) {
      toast.error(friendlyError(err));
    }
  }

  if (editando) {
    return (
      <li className="px-2 py-1.5">
        <form onSubmit={salvar} className="flex gap-1">
          <Input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} autoFocus className="h-8" aria-label="Nome da categoria" />
          <Button type="submit" size="icon" variant="ghost" className="size-8" aria-label="Salvar categoria">
            <Check />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="size-8" aria-label="Cancelar" onClick={() => setEditando(false)}>
            <X />
          </Button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-1 px-3 py-1.5 text-sm">
      <span className="flex-1 truncate">{categoria.nome}</span>
      <Button size="icon" variant="ghost" className="size-7" aria-label={`Renomear ${categoria.nome}`} onClick={() => setEditando(true)}>
        <Pencil className="size-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-7 text-muted-foreground hover:text-destructive"
        aria-label={`Excluir ${categoria.nome}`}
        disabled={del.isPending}
        onClick={() =>
          del.mutate(categoria.id, {
            onError: (e) => toast.error(friendlyError(e, "Não foi possível excluir a categoria.")),
          })
        }
      >
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  );
}
