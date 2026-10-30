-- Categorias financeiras
CREATE TABLE public.categorias_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(80) NOT NULL CHECK (length(btrim(nome)) > 0),
  tipo varchar(10) NOT NULL CHECK (tipo IN ('Receita', 'Despesa')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (nome, tipo)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias_financeiras TO authenticated;
GRANT ALL ON public.categorias_financeiras TO service_role;
ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categorias: equipe lê" ON public.categorias_financeiras
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Categorias: admin total" ON public.categorias_financeiras
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Categorias iniciais (dados de referência para cada escritório)
INSERT INTO public.categorias_financeiras (nome, tipo) VALUES
  ('Honorários contratuais', 'Receita'),
  ('Honorários sucumbenciais', 'Receita'),
  ('Honorários de êxito', 'Receita'),
  ('Reembolso de custas', 'Receita'),
  ('Custas processuais', 'Despesa'),
  ('Perícias e diligências', 'Despesa'),
  ('Cartório e certidões', 'Despesa'),
  ('Despesas administrativas', 'Despesa')
ON CONFLICT (nome, tipo) DO NOTHING;

-- Lançamentos financeiros
CREATE TABLE public.transacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid REFERENCES public.processos(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES public.clientes(id),
  categoria_id uuid NOT NULL REFERENCES public.categorias_financeiras(id),
  descricao varchar(255) NOT NULL CHECK (length(btrim(descricao)) > 0),
  tipo varchar(10) NOT NULL CHECK (tipo IN ('Receita', 'Despesa')),
  valor numeric(14,2) NOT NULL CHECK (valor > 0),
  data_vencimento date NOT NULL,
  data_pagamento date,
  status varchar(10) NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Pago', 'Atrasado')),
  comprovante_url text,
  criado_por uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transacoes_pago_tem_data CHECK (status <> 'Pago' OR data_pagamento IS NOT NULL)
);

CREATE INDEX transacoes_processo_idx ON public.transacoes (processo_id);
CREATE INDEX transacoes_cliente_idx ON public.transacoes (cliente_id);
CREATE INDEX transacoes_vencimento_idx ON public.transacoes (data_vencimento);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transacoes TO authenticated;
GRANT ALL ON public.transacoes TO service_role;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transações: admin total" ON public.transacoes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Transações: advogado lê as dos seus processos" ON public.transacoes
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'advogado')
    AND processo_id IS NOT NULL
    AND public.can_access_processo(auth.uid(), processo_id)
  );

-- Coerência: categoria do mesmo tipo e cliente herdado do processo
CREATE OR REPLACE FUNCTION public.validar_transacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tipo_categoria varchar;
BEGIN
  SELECT tipo INTO _tipo_categoria FROM public.categorias_financeiras WHERE id = NEW.categoria_id;
  IF _tipo_categoria IS NULL THEN
    RAISE EXCEPTION 'Categoria inexistente' USING ERRCODE = '23503';
  END IF;
  IF _tipo_categoria <> NEW.tipo THEN
    RAISE EXCEPTION 'A categoria escolhida não é do tipo %', NEW.tipo USING ERRCODE = '23514';
  END IF;
  IF NEW.processo_id IS NOT NULL AND NEW.cliente_id IS NULL THEN
    SELECT cliente_id INTO NEW.cliente_id FROM public.processos WHERE id = NEW.processo_id;
  END IF;
  IF NEW.status <> 'Pago' THEN
    NEW.data_pagamento := NULL;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validar_transacao() FROM public, anon, authenticated;

CREATE TRIGGER transacoes_validar
  BEFORE INSERT OR UPDATE ON public.transacoes
  FOR EACH ROW EXECUTE FUNCTION public.validar_transacao();

-- Comprovantes: quem pode ler um arquivo do bucket
CREATE OR REPLACE FUNCTION public.can_access_comprovante(_user_id uuid, _path text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
    OR (
      public.has_role(_user_id, 'advogado')
      AND EXISTS (
        SELECT 1 FROM public.transacoes t
        WHERE t.comprovante_url = _path
          AND t.processo_id IS NOT NULL
          AND public.can_access_processo(_user_id, t.processo_id)
      )
    )
$$;

CREATE POLICY "Comprovantes: ler" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'comprovantes-financeiros' AND public.can_access_comprovante(auth.uid(), name));
CREATE POLICY "Comprovantes: admin envia" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'comprovantes-financeiros' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Comprovantes: admin atualiza" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'comprovantes-financeiros' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'comprovantes-financeiros' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Comprovantes: admin remove" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'comprovantes-financeiros' AND public.has_role(auth.uid(), 'admin'));
