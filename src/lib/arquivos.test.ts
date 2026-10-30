import { describe, expect, it } from "vitest";
import { renameKeepingExtension, tipoPreview } from "./arquivos";

describe("pasta digital", () => {
  it("mantém a extensão original ao renomear sem extensão", () => {
    expect(renameKeepingExtension("peticao.pdf", "Petição inicial")).toBe("Petição inicial.pdf");
  });

  it("respeita a extensão digitada pelo usuário", () => {
    expect(renameKeepingExtension("peticao.pdf", "contrato.docx")).toBe("contrato.docx");
  });

  it("não aceita nome vazio", () => {
    expect(renameKeepingExtension("peticao.pdf", "   ")).toBe("peticao.pdf");
  });

  it("identifica arquivos que abrem dentro do sistema", () => {
    expect(tipoPreview("laudo.PDF")).toBe("pdf");
    expect(tipoPreview("foto.jpeg")).toBe("imagem");
    expect(tipoPreview("planilha.xlsx")).toBeNull();
  });
});
