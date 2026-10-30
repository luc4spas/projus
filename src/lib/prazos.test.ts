import { describe, expect, it } from "vitest";
import { urgenciaPrazo } from "./prazos";
import { isProcessoAtivo } from "./domain";

const now = new Date(2026, 9, 23, 10, 0); // 23/10/2026 10:00

describe("urgência de prazos", () => {
  it("tarefa cumprida é sempre 'cumprido', mesmo com data passada", () => {
    expect(urgenciaPrazo(new Date(2026, 9, 1), "Cumprido", now)).toBe("cumprido");
  });
  it("data fatal no passado e não cumprida é 'vencido'", () => {
    expect(urgenciaPrazo(new Date(2026, 9, 22, 18, 0), "Pendente", now)).toBe("vencido");
  });
  it("vence mais tarde no mesmo dia é 'hoje'", () => {
    expect(urgenciaPrazo(new Date(2026, 9, 23, 18, 0), "Em Andamento", now)).toBe("hoje");
  });
  it("vence em 3 dias é 'proximo'", () => {
    expect(urgenciaPrazo(new Date(2026, 9, 26, 9, 0), "Pendente", now)).toBe("proximo");
  });
  it("vence em 4 dias é 'futuro'", () => {
    expect(urgenciaPrazo(new Date(2026, 9, 27, 9, 0), "Pendente", now)).toBe("futuro");
  });
});

describe("processo ativo", () => {
  it("processo arquivado não conta como ativo", () => {
    expect(isProcessoAtivo("Arquivado")).toBe(false);
    expect(isProcessoAtivo("Recursal")).toBe(true);
  });
});
