import { describe, expect, it } from "vitest";
import { editarUsuarioSchema, novoUsuarioSchema } from "./usuarios";

const base = { nome: "Ana Souza", email: "Ana@Escritorio.com", senha: "segura123", papel: "advogado" as const };

describe("cadastro de usuários", () => {
  it("aceita usuário válido e normaliza o e-mail", () => {
    expect(novoUsuarioSchema.parse(base).email).toBe("ana@escritorio.com");
  });

  it("exige senha com pelo menos 8 caracteres", () => {
    expect(novoUsuarioSchema.safeParse({ ...base, senha: "1234567" }).success).toBe(false);
  });

  it("recusa papel inexistente", () => {
    expect(novoUsuarioSchema.safeParse({ ...base, papel: "superadmin" }).success).toBe(false);
  });

  it("na edição, senha vazia mantém a atual", () => {
    const id = "00000000-0000-4000-8000-000000000000";
    expect(editarUsuarioSchema.safeParse({ ...base, id, senha: "" }).success).toBe(true);
    expect(editarUsuarioSchema.safeParse({ ...base, id, senha: "123" }).success).toBe(false);
  });
});
