CREATE TABLE public.processo_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  data_movimentacao date NOT NULL DEFAULT current_date,
  descricao text NOT NULL CHECK (char_length(btrim(descricao)) BETWEEN 1 AND 8000),
  autor_id uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX processo_movimentacoes_processo_data_idx
  ON public.processo_movimentacoes (processo_id, data_movimentacao DESC, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.processo_movimentacoes TO authenticated;
GRANT ALL ON public.processo_movimentacoes TO service_role;

ALTER TABLE public.processo_movimentacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Movimentações: admin total" ON public.processo_movimentacoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Movimentações: advogado lê" ON public.processo_movimentacoes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'advogado') AND public.can_access_processo(auth.uid(), processo_id));
CREATE POLICY "Movimentações: advogado registra" ON public.processo_movimentacoes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'advogado') AND autor_id = auth.uid()
    AND public.can_access_processo(auth.uid(), processo_id));
CREATE POLICY "Movimentações: advogado edita as suas" ON public.processo_movimentacoes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'advogado') AND autor_id = auth.uid()
    AND public.can_access_processo(auth.uid(), processo_id))
  WITH CHECK (public.has_role(auth.uid(), 'advogado') AND autor_id = auth.uid()
    AND public.can_access_processo(auth.uid(), processo_id));

-- Backfill: o antigo campo único de andamento vira a primeira movimentação do histórico.
INSERT INTO public.processo_movimentacoes (processo_id, data_movimentacao, descricao, autor_id, created_at)
SELECT p.id, p.created_at::date, btrim(p.andamento), p.advogado_responsavel, p.created_at
FROM public.processos p
WHERE p.andamento IS NOT NULL AND btrim(p.andamento) <> '';

COMMENT ON COLUMN public.processos.andamento IS 'DEPRECATED: replaced by public.processo_movimentacoes (histórico com data)';