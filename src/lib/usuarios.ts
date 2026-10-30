/**
 * Regras de cadastro de usuários da equipe (validadas no navegador e no servidor).
 */
import { z } from "zod";

export const SENHA_MINIMA = 8;

const papel = z.enum(["admin", "advogado", "cliente"]);
const senha = z.string().min(SENHA_MINIMA, `A senha deve ter pelo menos ${SENHA_MINIMA} caracteres`).max(72);

export const novoUsuarioSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(255),
  senha,
  papel,
});
export type NovoUsuario = z.infer<typeof novoUsuarioSchema>;

export const editarUsuarioSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().trim().min(2, "Informe o nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(255),
  papel,
  /** Vazio mantém a senha atual. */
  senha: senha.or(z.literal("")).optional(),
});
export type EditarUsuario = z.infer<typeof editarUsuarioSchema>;

export const excluirUsuarioSchema = z.object({ id: z.string().uuid() });
