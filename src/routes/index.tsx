import { createFileRoute, redirect } from "@tanstack/react-router";

// A página inicial leva ao painel; a área protegida redireciona para o login quando necessário.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gestão Jurídica" },
      { name: "description", content: "Acesse o painel do escritório: processos, clientes e prazos." },
      { property: "og:title", content: "Gestão Jurídica" },
      { property: "og:description", content: "Acesse o painel do escritório: processos, clientes e prazos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
