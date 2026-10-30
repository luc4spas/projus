import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { tituloPagina } from "@/lib/marca";
import { marcaQueryOptions } from "@/features/configuracoes/api";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { friendlyError } from "@/lib/errors";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  beforeLoad: async ({ context }) => ({
    marca: await context.queryClient.ensureQueryData(marcaQueryOptions()),
  }),
  head: ({ match }) => ({
    meta: [
      { title: tituloPagina("Redefinir senha", match.context.marca) },
      { name: "description", content: "Defina uma nova senha de acesso ao sistema." },
      { property: "og:title", content: tituloPagina("Redefinir senha", match.context.marca) },
      { property: "og:description", content: "Defina uma nova senha de acesso ao sistema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session && isRecovery) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirm"))) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    toast.success("Senha atualizada.");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-card">
        <div className="mb-5 flex size-11 items-center justify-center rounded-full bg-brass-soft text-brass-foreground">
          <KeyRound className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold">Nova senha</h1>
        {ready ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" name="password" type="password" minLength={6} required autoComplete="new-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar senha</Label>
              <Input id="confirm" name="confirm" type="password" minLength={6} required autoComplete="new-password" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Salvar nova senha
            </Button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Abra esta página pelo link enviado ao seu e-mail para definir uma nova senha.
          </p>
        )}
      </div>
    </div>
  );
}
