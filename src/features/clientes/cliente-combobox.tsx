import { useState } from "react";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { formatDocumento } from "@/lib/documento";
import { cn } from "@/lib/utils";
import type { Cliente } from "./api";

/** Campo de busca de cliente por nome ou CPF/CNPJ, com atalho para cadastrar um novo. */
export function ClienteCombobox({
  clientes,
  value,
  onChange,
  onNovoCliente,
  placeholder = "Buscar cliente…",
  invalid,
}: {
  clientes: Pick<Cliente, "id" | "nome" | "documento">[];
  value: string;
  onChange: (id: string) => void;
  onNovoCliente?: () => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selecionado = clientes.find((c) => c.id === value);

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={invalid || undefined}
            className={cn(
              "min-w-0 flex-1 justify-between font-normal",
              !selecionado && "text-muted-foreground",
              invalid && "border-destructive",
            )}
          >
            <span className="truncate">{selecionado ? selecionado.nome : placeholder}</span>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-72 p-0" align="start">
          <Command
            filter={(itemValue, search) => {
              const q = search.toLowerCase().trim();
              const digits = q.replace(/\D/g, "");
              const v = itemValue.toLowerCase();
              return v.includes(q) || (digits.length > 0 && v.includes(digits)) ? 1 : 0;
            }}
          >
            <CommandInput placeholder="Nome ou CPF/CNPJ" />
            <CommandList>
              <CommandEmpty>
                <div className="space-y-2 px-2">
                  <p>Nenhum cliente encontrado.</p>
                  {onNovoCliente && <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      onNovoCliente?.();
                    }}
                  >
                    <UserPlus /> Cadastrar novo cliente
                  </Button>}
                </div>
              </CommandEmpty>
              <CommandGroup>
                {clientes.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`${c.nome} ${c.documento} ${c.id}`}
                    onSelect={() => {
                      onChange(c.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("size-4", c.id === value ? "opacity-100" : "opacity-0")} />
                    <div className="min-w-0">
                      <p className="truncate">{c.nome}</p>
                      <p className="font-mono text-xs text-muted-foreground">{formatDocumento(c.documento)}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {onNovoCliente && (
        <Button type="button" variant="outline" size="icon" aria-label="Cadastrar novo cliente" title="Cadastrar novo cliente" onClick={onNovoCliente}>
          <UserPlus />
        </Button>
      )}
    </div>
  );
}
