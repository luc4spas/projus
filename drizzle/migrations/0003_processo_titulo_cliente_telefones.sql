ALTER TABLE public.processos ADD COLUMN IF NOT EXISTS titulo varchar(200);
ALTER TABLE public.processos ALTER COLUMN numero_cnj DROP NOT NULL;

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS telefones jsonb NOT NULL DEFAULT '[]'::jsonb;
UPDATE public.clientes
  SET telefones = jsonb_build_array(jsonb_build_object('numero', telefone, 'whatsapp', false))
  WHERE telefone IS NOT NULL AND btrim(telefone) <> '' AND telefones = '[]'::jsonb;
ALTER TABLE public.clientes ADD CONSTRAINT clientes_telefones_array CHECK (jsonb_typeof(telefones) = 'array');
COMMENT ON COLUMN public.clientes.telefone IS 'DEPRECATED: replaced by telefones (jsonb array of {numero, whatsapp})';