import { describe, expect, it } from "vitest";
import { agruparPorDia, chaveDia, diasDaGrade } from "./agenda";

describe("agenda mensal", () => {
  it("grade começa no domingo e termina no sábado", () => {
    const dias = diasDaGrade(new Date(2026, 9, 15)); // outubro/2026
    expect(dias[0]?.getDay()).toBe(0);
    expect(dias.at(-1)?.getDay()).toBe(6);
    expect(dias.length % 7).toBe(0);
    expect(dias.some((d) => chaveDia(d) === "2026-10-01")).toBe(true);
    expect(dias.some((d) => chaveDia(d) === "2026-10-31")).toBe(true);
  });

  it("agrupa prazos no dia da data fatal, em ordem de horário", () => {
    const mapa = agruparPorDia([
      { id: "b", data_fatal: new Date(2026, 9, 20, 18, 0).toISOString() },
      { id: "a", data_fatal: new Date(2026, 9, 20, 9, 0).toISOString() },
      { id: "c", data_fatal: new Date(2026, 9, 21, 9, 0).toISOString() },
    ]);
    expect(mapa.get("2026-10-20")?.map((t) => t.id)).toEqual(["a", "b"]);
    expect(mapa.get("2026-10-21")?.map((t) => t.id)).toEqual(["c"]);
  });
});
