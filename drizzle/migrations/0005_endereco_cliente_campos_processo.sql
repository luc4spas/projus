ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS cep varchar(9),
  ADD COLUMN IF NOT EXISTS logradouro varchar(200),
  ADD COLUMN IF NOT EXISTS numero varchar(20),
  ADD COLUMN IF NOT EXISTS complemento varchar(120),
  ADD COLUMN IF NOT EXISTS bairro varchar(120),
  ADD COLUMN IF NOT EXISTS cidade varchar(120),
  ADD COLUMN IF NOT EXISTS uf varchar(2);

ALTER TABLE public.processos
  ADD COLUMN IF NOT EXISTS sistema varchar(60),
  ADD COLUMN IF NOT EXISTS andamento text,
  ADD COLUMN IF NOT EXISTS descricao_acao text;