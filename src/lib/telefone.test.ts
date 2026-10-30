import { describe, expect, it } from "vitest";
import { formatTelefone, isValidTelefone, normalizeTelefones, parseTelefones, whatsappLink } from "./telefone";

describe("telefones do cliente", () => {
  it("aplica máscara de celular e fixo", () => {
    expect(formatTelefone("11912345678")).toBe("(11) 91234-5678");
    expect(formatTelefone("1132345678")).toBe("(11) 3234-5678");
  });

  it("aceita apenas DDD + 8 ou 9 dígitos", () => {
    expect(isValidTelefone("(11) 91234-5678")).toBe(true);
    expect(isValidTelefone("91234-5678")).toBe(false);
  });

  it("permite marcar só um número como WhatsApp", () => {
    const out = normalizeTelefones([
      { numero: "(11) 91234-5678", whatsapp: true },
      { numero: "(11) 98888-7777", whatsapp: true },
    ]);
    expect(out.filter((t) => t.whatsapp)).toHaveLength(1);
    expect(out[0]?.whatsapp).toBe(true);
  });

  it("descarta linhas de telefone vazias", () => {
    expect(normalizeTelefones([{ numero: "  ", whatsapp: false }])).toEqual([]);
  });

  it("lê com segurança dados inválidos do banco", () => {
    expect(parseTelefones(null)).toEqual([]);
    expect(parseTelefones([{ numero: "(11) 3234-5678" }])).toEqual([{ numero: "(11) 3234-5678", whatsapp: false }]);
  });

  it("gera link do WhatsApp com código do Brasil", () => {
    expect(whatsappLink("(11) 91234-5678")).toBe("https://wa.me/5511912345678");
  });
});
