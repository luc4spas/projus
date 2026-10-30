import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { tituloPagina } from "@/lib/marca";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { friendlyError } from "@/lib/errors";
import colunas from "@/assets/login-colunas.jpg";
import { marcaQueryOptions, useMarca } from "@/features/configuracoes/api";

const searchSchema = z.object({ redirect: z.string().optional() });

/** Aceita apenas caminhos internos para evitar redirecionamento aberto. */
const safeRedirect = (value?: string) =>
  value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/auth") ? value : "/dashboard";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  beforeLoad: async ({ search, context }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: safeRedirect(search.redirect) });
    return { marca: await context.queryClient.ensureQueryData(marcaQueryOptions()) };
  },
  head: ({ match }) => ({
    meta: [
      { title: tituloPagina("Entrar", match.context.marca) },
      { name: "description", content: "Acesso seguro ao sistema de gestão jurídica do escritório." },
      { property: "og:title", content: tituloPagina("Entrar", match.context.marca) },
      { property: "og:description", content: "Acesso seguro ao sistema de gestão jurídica do escritório." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const target = safeRedirect(search.redirect);
  const [loading, setLoading] = useState(false);

  const goIn = () => navigate({ to: target, replace: true });

  async function handleSignIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) {
      toast.error(friendlyError(error, "Não foi possível entrar."));
      return;
    }
    goIn();
  }

  async function handleForgot(email: string) {
    if (!email) {
      toast.error("Informe seu e-mail no campo acima.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    toast.success("Enviamos um link de redefinição para seu e-mail.");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink lg:block">
        <img
          src={colunas}
          alt="Colunas de mármore de um tribunal ao entardecer"
          width={1024}
          height={1408}
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-12 text-ink-foreground">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-brass text-brass-foreground">
              <Scale className="size-4" />
            </div>
            <span className="font-display text-xl font-semibold">Toga</span>
          </div>
          <div className="max-w-md space-y-4">
            <div className="rule-brass" />
            <p className="font-display text-3xl leading-snug">
              Cada prazo no lugar certo. Cada documento no processo certo.
            </p>
            <p className="text-sm text-ink-foreground/70">
              Processos, pastas digitais e a pauta da equipe, com acesso controlado por papel.
            </p>
          </div>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Scale className="size-4" />
            </div>
            <span className="font-display text-xl font-semibold">Toga</span>
          </div>

          <div className="mb-6 space-y-2">
            <p className="eyebrow">Acesso seguro</p>
            <h1 className="text-3xl font-semibold">Bem-vindo de volta</h1>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">E-mail</Label>
              <Input id="login-email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Senha</Label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  onClick={() =>
                    handleForgot((document.getElementById("login-email") as HTMLInputElement)?.value.trim())
                  }
                >
                  Esqueci minha senha
                </button>
              </div>
              <Input id="login-password" name="password" type="password" autoComplete="current-password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Entrar
            </Button>
          </form>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Não tem acesso? Peça a um administrador do escritório para criar sua conta.
          </p>
        </div>
      </main>
    </div>
  );
}
