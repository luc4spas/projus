import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { editarUsuarioSchema, excluirUsuarioSchema, novoUsuarioSchema } from "@/lib/usuarios";

/**
 * Gestão de contas da equipe. Só administradores podem chamar estas funções;
 * as mensagens de erro lançadas aqui já são próprias para exibir ao usuário.
 */

type AuthCtx = { supabase: SupabaseClient<Database>; userId: string };

async function exigirAdmin(context: AuthCtx) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .maybeSingle();
  if (error || data?.role !== "admin") throw new Error("Apenas administradores podem gerenciar usuários.");
}

function traduzirErroAuth(error: { message?: string | undefined; code?: string | undefined } | null, fallback: string): Error {
  const msg = error?.message ?? "";
  if (/already been registered|already registered|email_exists|already exists/i.test(msg) || error?.code === "email_exists") {
    return new Error("Este e-mail já está cadastrado.");
  }
  if (error?.code === "weak_password" || /weak|easy to guess|pwned|leaked/i.test(msg)) {
    return new Error("Esta senha é fraca ou já apareceu em vazamentos na internet. Escolha uma senha mais forte.");
  }
  if (/password/i.test(msg)) return new Error("Senha recusada. Use pelo menos 8 caracteres, com letras, números e símbolos.");
  if (/invalid.*email|email.*invalid/i.test(msg)) return new Error("E-mail inválido.");
  console.error("[usuarios]", error);
  return new Error(fallback);
}

export const criarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => novoUsuarioSchema.parse(input))
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
      user_metadata: { nome: data.nome },
    });
    if (error || !created.user) throw traduzirErroAuth(error, "Não foi possível criar o usuário.");
    const id = created.user.id;

    // O gatilho de novas contas cria o perfil e o papel "cliente"; aqui aplicamos o papel escolhido.
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabaseAdmin.from("perfis").upsert({ id, nome: data.nome, email: data.email }),
      supabaseAdmin.from("user_roles").update({ role: data.papel }).eq("user_id", id),
    ]);
    if (e1 || e2) {
      console.error("[usuarios] perfil/papel", e1 ?? e2);
      throw new Error("Usuário criado, mas não foi possível definir nome ou papel. Ajuste na lista.");
    }
    return { id };
  });

export const atualizarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => editarUsuarioSchema.parse(input))
  .handler(async ({ data, context }) => {
    const ctx: AuthCtx = context;
    await exigirAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const proprio = data.id === ctx.userId;
    const { data: atual, error: eAtual } = await supabaseAdmin.auth.admin.getUserById(data.id);
    if (eAtual || !atual.user) throw new Error("Usuário não encontrado.");

    const mudancas: { email?: string; password?: string; email_confirm?: boolean; user_metadata?: object } = {
      user_metadata: { ...(atual.user.user_metadata ?? {}), nome: data.nome },
    };
    if (data.email !== (atual.user.email ?? "").toLowerCase()) {
      mudancas.email = data.email;
      mudancas.email_confirm = true;
    }
    if (data.senha) mudancas.password = data.senha;

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, mudancas);
    if (error) throw traduzirErroAuth(error, "Não foi possível atualizar o usuário.");

    const { error: e1 } = await supabaseAdmin.from("perfis").update({ nome: data.nome, email: data.email }).eq("id", data.id);
    if (e1) throw new Error("Não foi possível atualizar o perfil.");

    // O administrador não altera o próprio papel, para nunca ficar sem acesso.
    if (!proprio) {
      const { error: e2 } = await supabaseAdmin.from("user_roles").update({ role: data.papel }).eq("user_id", data.id);
      if (e2) throw new Error("Não foi possível atualizar o papel.");
    }
    return { id: data.id };
  });

export const excluirUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => excluirUsuarioSchema.parse(input))
  .handler(async ({ data, context }) => {
    const ctx: AuthCtx = context;
    await exigirAdmin(ctx);
    if (data.id === ctx.userId) throw new Error("Você não pode excluir a própria conta.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw traduzirErroAuth(error, "Não foi possível excluir o usuário.");
    return { id: data.id };
  });
