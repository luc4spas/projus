CREATE TABLE public.configuracoes (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  nome_sistema varchar(60) NOT NULL DEFAULT 'Toga' CHECK (char_length(btrim(nome_sistema)) >= 2),
  subtitulo varchar(60) NOT NULL DEFAULT 'Gestão Jurídica',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.configuracoes TO anon, authenticated;
GRANT UPDATE (nome_sistema, subtitulo, updated_at) ON public.configuracoes TO authenticated;
GRANT ALL ON public.configuracoes TO service_role;

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos leem a identidade do sistema"
  ON public.configuracoes FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Somente admin altera a identidade do sistema"
  ON public.configuracoes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.configuracoes (id) VALUES (true) ON CONFLICT (id) DO NOTHING;