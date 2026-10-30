/**
 * Converte erros do backend em mensagens amigáveis, sem expor detalhes técnicos.
 */
type BackendError = { code?: string; message?: string; statusCode?: string | number } | null | undefined;

export function friendlyError(error: unknown, fallback = "Não foi possível concluir a operação."): string {
  const e = error as BackendError;
  const code = e?.code;
  const msg = e?.message ?? "";
  if (code === "42501" || /row-level security|permission denied/i.test(msg) || e?.statusCode === "403") {
    return "Você não tem permissão para esta ação.";
  }
  if (code === "23505") return "Já existe um registro com estes dados.";
  if (/categoria escolhida/i.test(msg)) return "A categoria escolhida não corresponde ao tipo do lançamento.";
  if (code === "23514") return "Alguns dados informados não são válidos.";
  if (code === "23503") return "Este registro está vinculado a outros dados e não pode ser alterado.";
  if (/Invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/Email not confirmed/i.test(msg)) return "Confirme seu e-mail antes de entrar.";
  if (/User already registered|already been registered/i.test(msg)) return "Este e-mail já está cadastrado.";
  if (/Password should be/i.test(msg)) return "A senha deve ter pelo menos 6 caracteres.";
  if (/Failed to fetch|NetworkError/i.test(msg)) return "Falha de conexão. Verifique sua internet.";
  return fallback;
}
