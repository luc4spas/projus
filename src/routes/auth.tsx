import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { tituloPagina } from "@/lib/marca";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { friendlyError } from "@/lib/errors";
import logo from "@/assets/logo.jpg";
import { marcaQueryOptions } from "@/features/configuracoes/api";

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
      { title: tituloPagina("Acesso ao Sistema", match.context.marca) },
      { name: "description", content: "Portal exclusivo de acesso aos processos e gestão jurídica Danielle Blanco Advocacia Estratégica." },
      { property: "og:title", content: tituloPagina("Acesso ao Sistema", match.context.marca) },
      { property: "og:description", content: "Portal exclusivo de acesso aos processos e gestão jurídica Danielle Blanco Advocacia Estratégica." },
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
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  const goIn = () => navigate({ to: target, replace: true });

  async function handleSignIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || emailInput).trim();
    const password = String(form.get("password"));

    if (!email || !password) {
      toast.error("Por favor, preencha o e-mail e a senha.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      toast.error(friendlyError(error, "Não foi possível entrar. Verifique seu e-mail e senha."));
      return;
    }

    toast.success("Login realizado com sucesso!");
    goIn();
  }

  async function handleForgot() {
    const email = emailInput.trim();
    if (!email) {
      toast.error("Por favor, digite seu e-mail no campo abaixo para redefinir a senha.");
      document.getElementById("login-email")?.focus();
      return;
    }

    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);

    if (error) {
      toast.error(friendlyError(error, "Não foi possível enviar o e-mail de redefinição."));
      return;
    }

    toast.success("Enviamos as instruções de redefinição para o seu e-mail.");
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_1fr]">
      {/* Coluna Visual de Identidade (Desktop) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#121316] p-12 text-[#F5EFEB] lg:flex border-r border-[#C5A059]/20">
        {/* Glow dourado de fundo */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: "radial-gradient(circle at 50% 45%, rgba(197, 160, 89, 0.22) 0%, rgba(18, 19, 22, 0) 65%)",
          }}
        />

        {/* Textura sutil decorativa */}
        <div className="absolute inset-0 bg-[radial-gradient(#C5A059_0.75px,transparent_0.75px)] [background-size:24px_24px] opacity-10" />

        {/* Topo do painel visual */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-[#C5A059] uppercase">
            <span className="size-2 rounded-full bg-[#C5A059] animate-pulse" />
            Sistema de Gestão Jurídica
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-[#C5A059]/30 bg-[#C5A059]/10 px-3 py-1 text-[11px] font-medium text-[#E5C788]">
            <ShieldCheck className="size-3.5 text-[#C5A059]" />
            Acesso Restrito
          </div>
        </div>

        {/* Centro - Logotipo com acabamento premium */}
        <div className="relative z-10 my-auto flex flex-col items-center text-center">
          <div className="group relative mb-8 rounded-3xl border border-[#C5A059]/40 bg-[#1A1C22]/90 p-4 shadow-2xl shadow-black/80 backdrop-blur-md transition-all duration-300 hover:border-[#C5A059]/60 hover:shadow-[#C5A059]/10">
            <div className="overflow-hidden rounded-2xl bg-[#F7F4F0] p-3 shadow-inner">
              <img
                src={logo}
                alt="Danielle Blanco Advocacia Estratégica"
                width={360}
                height={360}
                className="size-64 object-contain transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
          </div>

          <div className="max-w-md space-y-3">
            <div className="mx-auto h-[1px] w-20 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />
            <h2 className="font-display text-2xl font-medium tracking-wide text-[#F5EFEB] lg:text-3xl">
              Advocacia Estratégica &amp; Eficiência
            </h2>
            <p className="text-sm leading-relaxed text-[#F5EFEB]/70">
              Controle absoluto de processos, prazos e clientes com sigilo, pontualidade e excelência operacional.
            </p>
          </div>
        </div>

        {/* Rodapé do painel visual */}
        <div className="relative z-10 flex items-center justify-between border-t border-[#C5A059]/20 pt-6 text-xs text-[#F5EFEB]/60">
          <span>Danielle Blanco Advocacia</span>
          <span className="flex items-center gap-1">
            <Lock className="size-3 text-[#C5A059]" />
            Criptografia de Ponta a Ponta
          </span>
        </div>
      </aside>

      {/* Coluna do Formulário de Login */}
      <main className="flex flex-col justify-between px-6 py-10 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm my-auto">
          {/* Logo e Cabeçalho Mobile */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="mb-4 rounded-2xl border border-[#C5A059]/40 bg-card p-2 shadow-md">
              <img
                src={logo}
                alt="Danielle Blanco Advocacia Estratégica"
                width={160}
                height={160}
                className="size-28 object-contain rounded-xl"
              />
            </div>
            <span className="text-xs font-semibold tracking-wider text-[#9E7A33] uppercase">
              Advocacia Estratégica
            </span>
          </div>

          {/* Título de Boas-vindas */}
          <div className="mb-8 space-y-1.5 text-center lg:text-left">
            <div className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-[#C5A059]/30 bg-[#C5A059]/10 px-3 py-1 text-xs font-medium text-[#9E7A33]">
              <Lock className="size-3 text-[#9E7A33]" />
              Portal Corporativo
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground pt-2">
              Bem-vindo de volta
            </h1>
            <p className="text-sm text-muted-foreground">
              Entre com suas credenciais para gerenciar processos e prazos.
            </p>
          </div>

          {/* Formulário de Acesso */}
          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-xs font-medium uppercase tracking-wider text-foreground/80">
                E-mail corporativo
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  autoComplete="email"
                  placeholder="advogado@danielleblanco.com.br"
                  required
                  className="pl-10 h-11 transition-all focus-visible:ring-1 focus-visible:ring-[#C5A059] focus-visible:border-[#C5A059]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-xs font-medium uppercase tracking-wider text-foreground/80">
                  Senha de acesso
                </Label>
                <button
                  type="button"
                  disabled={forgotLoading}
                  className="text-xs text-[#9E7A33] hover:text-[#7A5E26] underline-offset-4 hover:underline transition-colors disabled:opacity-50"
                  onClick={handleForgot}
                >
                  {forgotLoading ? "Enviando..." : "Esqueci a senha"}
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  required
                  className="pl-10 pr-10 h-11 transition-all focus-visible:ring-1 focus-visible:ring-[#C5A059] focus-visible:border-[#C5A059]"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-gradient-to-r from-[#9E7A33] via-[#B8934A] to-[#C5A059] font-medium text-white shadow-md shadow-[#9E7A33]/25 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer border-0"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                "Entrar no Sistema"
              )}
            </Button>
          </form>

          {/* Avisos de Segurança e Acesso */}
          <div className="mt-8 rounded-xl border border-border/80 bg-muted/40 p-3.5 text-center text-xs text-muted-foreground">
            <p>
              Não possui acesso ao escritório? Solicite suas credenciais com o administrador.
            </p>
          </div>
        </div>

        {/* Rodapé Inferior */}
        <footer className="mt-8 text-center text-[11px] text-muted-foreground/70">
          <p>© {new Date().getFullYear()} Danielle Blanco Advocacia Estratégica. Todos os direitos reservados.</p>
        </footer>
      </main>
    </div>
  );
}
