-- ==============================================================================
-- SCHEMA COMPLETO DO BANCO DE DADOS - PROJUS / DANIELLE BLANCO ADVOCACIA
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS E ENUMS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'advogado', 'cliente');
  END IF;
END $$;

-- 3. TABELA PERFIS
CREATE TABLE IF NOT EXISTS public.perfis (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome varchar(160) NOT NULL DEFAULT '',
  email varchar(255),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.perfis TO authenticated;
GRANT ALL ON public.perfis TO service_role;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- 4. TABELA USER_ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. FUNÇÕES DE SEGURANÇA E AUXILIARES
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'advogado'));
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;

-- 6. TABELA CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(200) NOT NULL,
  documento varchar(20) NOT NULL UNIQUE,
  tipo varchar(20) NOT NULL DEFAULT 'Pessoa Física',
  email varchar(255),
  telefone varchar(40),
  telefones jsonb NOT NULL DEFAULT '[]'::jsonb CONSTRAINT clientes_telefones_array CHECK (jsonb_typeof(telefones) = 'array'),
  cep varchar(9),
  logradouro varchar(200),
  numero varchar(20),
  complemento varchar(120),
  bairro varchar(120),
  cidade varchar(120),
  uf varchar(2),
  criado_por uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON COLUMN public.clientes.telefone IS 'DEPRECATED: replaced by telefones (jsonb array of {numero, whatsapp})';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- 7. TABELA PROCESSOS
CREATE TABLE IF NOT EXISTS public.processos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo varchar(200),
  numero_cnj varchar(32),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE RESTRICT,
  tribunal varchar(120),
  comarca varchar(120),
  vara varchar(160),
  fase_atual varchar(60) NOT NULL DEFAULT 'Conhecimento',
  valor_causa numeric(14,2),
  advogado_responsavel uuid,
  sistema varchar(60),
  andamento text,
  descricao_acao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON COLUMN public.processos.andamento IS 'DEPRECATED: replaced by public.processo_movimentacoes (histórico com data)';
CREATE INDEX IF NOT EXISTS processos_advogado_idx ON public.processos(advogado_responsavel);
CREATE INDEX IF NOT EXISTS processos_cliente_idx ON public.processos(cliente_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.processos TO authenticated;
GRANT ALL ON public.processos TO service_role;
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_processo(_user_id uuid, _processo_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin')
      OR EXISTS (SELECT 1 FROM public.processos p WHERE p.id = _processo_id AND p.advogado_responsavel = _user_id);
$$;

REVOKE EXECUTE ON FUNCTION public.can_access_processo(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.can_access_processo(uuid, uuid) TO authenticated;

-- 8. TABELA PRAZOS E TAREFAS
CREATE TABLE IF NOT EXISTS public.prazos_e_tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid REFERENCES public.processos(id) ON DELETE CASCADE,
  titulo varchar(200) NOT NULL,
  descricao text,
  data_fatal timestamptz NOT NULL,
  responsavel_id uuid,
  status varchar(20) NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente','Em Andamento','Cumprido')),
  criado_por uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tarefas_responsavel_idx ON public.prazos_e_tarefas(responsavel_id);
CREATE INDEX IF NOT EXISTS tarefas_data_fatal_idx ON public.prazos_e_tarefas(data_fatal);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prazos_e_tarefas TO authenticated;
GRANT ALL ON public.prazos_e_tarefas TO service_role;
ALTER TABLE public.prazos_e_tarefas ENABLE ROW LEVEL SECURITY;

-- 9. TABELA PASTAS DIGITAIS
CREATE TABLE IF NOT EXISTS public.pastas_digitais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  nome_documento varchar(255) NOT NULL,
  arquivo_url text NOT NULL,
  tamanho_bytes bigint,
  data_upload timestamptz NOT NULL DEFAULT now(),
  uploader_id uuid DEFAULT auth.uid()
);
CREATE INDEX IF NOT EXISTS pastas_processo_idx ON public.pastas_digitais(processo_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pastas_digitais TO authenticated;
GRANT ALL ON public.pastas_digitais TO service_role;
ALTER TABLE public.pastas_digitais ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_processo_path(_user_id uuid, _folder text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN public.can_access_processo(_user_id, _folder::uuid);
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.can_access_processo_path(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.can_access_processo_path(uuid, text) TO authenticated;

-- 10. TABELA CONFIGURAÇÕES (IDENTIDADE DA MARCA)
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  nome_sistema varchar(60) NOT NULL DEFAULT 'Danielle Blanco' CHECK (char_length(btrim(nome_sistema)) >= 2),
  subtitulo varchar(60) NOT NULL DEFAULT 'Advocacia Estratégica',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.configuracoes TO anon, authenticated;
GRANT UPDATE (nome_sistema, subtitulo, updated_at) ON public.configuracoes TO authenticated;
GRANT ALL ON public.configuracoes TO service_role;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

INSERT INTO public.configuracoes (id, nome_sistema, subtitulo)
VALUES (true, 'Danielle Blanco', 'Advocacia Estratégica')
ON CONFLICT (id) DO UPDATE SET
  nome_sistema = EXCLUDED.nome_sistema,
  subtitulo = EXCLUDED.subtitulo;

-- 11. TABELA PROCESSO MOVIMENTAÇÕES
CREATE TABLE IF NOT EXISTS public.processo_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  data_movimentacao date NOT NULL DEFAULT current_date,
  descricao text NOT NULL CHECK (char_length(btrim(descricao)) BETWEEN 1 AND 8000),
  autor_id uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS processo_movimentacoes_processo_data_idx
  ON public.processo_movimentacoes (processo_id, data_movimentacao DESC, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.processo_movimentacoes TO authenticated;
GRANT ALL ON public.processo_movimentacoes TO service_role;
ALTER TABLE public.processo_movimentacoes ENABLE ROW LEVEL SECURITY;

-- 12. MÓDULO FINANCEIRO: CATEGORIAS E TRANSAÇÕES
CREATE TABLE IF NOT EXISTS public.categorias_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(80) NOT NULL CHECK (length(btrim(nome)) > 0),
  tipo varchar(10) NOT NULL CHECK (tipo IN ('Receita', 'Despesa')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (nome, tipo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias_financeiras TO authenticated;
GRANT ALL ON public.categorias_financeiras TO service_role;
ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;

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

CREATE TABLE IF NOT EXISTS public.transacoes (
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
CREATE INDEX IF NOT EXISTS transacoes_processo_idx ON public.transacoes (processo_id);
CREATE INDEX IF NOT EXISTS transacoes_cliente_idx ON public.transacoes (cliente_id);
CREATE INDEX IF NOT EXISTS transacoes_vencimento_idx ON public.transacoes (data_vencimento);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transacoes TO authenticated;
GRANT ALL ON public.transacoes TO service_role;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.validar_transacao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

DROP TRIGGER IF EXISTS transacoes_validar ON public.transacoes;
CREATE TRIGGER transacoes_validar
  BEFORE INSERT OR UPDATE ON public.transacoes
  FOR EACH ROW EXECUTE FUNCTION public.validar_transacao();

CREATE OR REPLACE FUNCTION public.can_access_comprovante(_user_id uuid, _path text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin')
    OR (
      public.has_role(_user_id, 'advogado')
      AND EXISTS (
        SELECT 1 FROM public.transacoes t
        WHERE t.comprovante_url = _path
          AND t.processo_id IS NOT NULL
          AND public.can_access_processo(_user_id, t.processo_id)
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_access_comprovante(uuid, text) TO authenticated;

-- 13. GATILHO DE CRIAÇÃO AUTOMÁTICA DE PERFIL E PAPEL NO AUTH
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.perfis (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'nome', ''), NULLIF(NEW.raw_user_meta_data->>'full_name', ''), SPLIT_PART(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    nome = COALESCE(NULLIF(EXCLUDED.nome, ''), public.perfis.nome),
    email = EXCLUDED.email;

  -- O primeiro usuário do sistema torna-se administrador; os demais começam como 'cliente'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN 'cliente'::public.app_role ELSE 'admin'::public.app_role end
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14. BUCKETS DE ARMAZENAMENTO (STORAGE)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('pastas-digitais', 'pastas-digitais', false),
  ('comprovantes-financeiros', 'comprovantes-financeiros', false)
ON CONFLICT (id) DO NOTHING;

-- 15. POLÍTICAS DE RLS (ROW LEVEL SECURITY)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Perfis: ver o próprio ou equipe" ON public.perfis;
  DROP POLICY IF EXISTS "Perfis: editar o próprio" ON public.perfis;
  DROP POLICY IF EXISTS "Perfis: admin edita todos" ON public.perfis;
  DROP POLICY IF EXISTS "Papéis: ver o próprio ou equipe" ON public.user_roles;
  DROP POLICY IF EXISTS "Papéis: admin insere" ON public.user_roles;
  DROP POLICY IF EXISTS "Papéis: admin altera" ON public.user_roles;
  DROP POLICY IF EXISTS "Papéis: admin remove" ON public.user_roles;
  DROP POLICY IF EXISTS "Clientes: equipe lê" ON public.clientes;
  DROP POLICY IF EXISTS "Clientes: equipe cria" ON public.clientes;
  DROP POLICY IF EXISTS "Clientes: equipe edita" ON public.clientes;
  DROP POLICY IF EXISTS "Clientes: admin remove" ON public.clientes;
  DROP POLICY IF EXISTS "Processos: admin total" ON public.processos;
  DROP POLICY IF EXISTS "Processos: advogado lê os seus" ON public.processos;
  DROP POLICY IF EXISTS "Processos: advogado atualiza os seus" ON public.processos;
  DROP POLICY IF EXISTS "Processos: advogado cria como responsável" ON public.processos;
  DROP POLICY IF EXISTS "Tarefas: admin total" ON public.prazos_e_tarefas;
  DROP POLICY IF EXISTS "Tarefas: advogado lê" ON public.prazos_e_tarefas;
  DROP POLICY IF EXISTS "Tarefas: advogado atualiza" ON public.prazos_e_tarefas;
  DROP POLICY IF EXISTS "Tarefas: advogado cria" ON public.prazos_e_tarefas;
  DROP POLICY IF EXISTS "Pastas: admin total" ON public.pastas_digitais;
  DROP POLICY IF EXISTS "Pastas: advogado lê" ON public.pastas_digitais;
  DROP POLICY IF EXISTS "Pastas: advogado atualiza os seus" ON public.pastas_digitais;
  DROP POLICY IF EXISTS "Pastas: advogado envia" ON public.pastas_digitais;
  DROP POLICY IF EXISTS "Todos leem a identidade do sistema" ON public.configuracoes;
  DROP POLICY IF EXISTS "Somente admin altera a identidade do sistema" ON public.configuracoes;
  DROP POLICY IF EXISTS "Movimentações: admin total" ON public.processo_movimentacoes;
  DROP POLICY IF EXISTS "Movimentações: advogado lê" ON public.processo_movimentacoes;
  DROP POLICY IF EXISTS "Movimentações: advogado registra" ON public.processo_movimentacoes;
  DROP POLICY IF EXISTS "Movimentações: advogado edita as suas" ON public.processo_movimentacoes;
  DROP POLICY IF EXISTS "Categorias: equipe lê" ON public.categorias_financeiras;
  DROP POLICY IF EXISTS "Categorias: admin total" ON public.categorias_financeiras;
  DROP POLICY IF EXISTS "Transações: admin total" ON public.transacoes;
  DROP POLICY IF EXISTS "Transações: advogado lê as dos seus processos" ON public.transacoes;
  DROP POLICY IF EXISTS "Pasta digital: ler arquivos do processo" ON storage.objects;
  DROP POLICY IF EXISTS "Pasta digital: enviar arquivos ao processo" ON storage.objects;
  DROP POLICY IF EXISTS "Pasta digital: admin remove arquivos" ON storage.objects;
  DROP POLICY IF EXISTS "Comprovantes: ler" ON storage.objects;
  DROP POLICY IF EXISTS "Comprovantes: admin envia" ON storage.objects;
  DROP POLICY IF EXISTS "Comprovantes: admin atualiza" ON storage.objects;
  DROP POLICY IF EXISTS "Comprovantes: admin remove" ON storage.objects;
END $$;

CREATE POLICY "Perfis: ver o próprio ou equipe" ON public.perfis FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Perfis: editar o próprio" ON public.perfis FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Perfis: admin edita todos" ON public.perfis FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Papéis: ver o próprio ou equipe" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Papéis: admin insere" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Papéis: admin altera" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Papéis: admin remove" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clientes: equipe lê" ON public.clientes FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "Clientes: equipe cria" ON public.clientes FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) AND criado_por = auth.uid());
CREATE POLICY "Clientes: equipe edita" ON public.clientes FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Clientes: admin remove" ON public.clientes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Processos: admin total" ON public.processos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Processos: advogado lê os seus" ON public.processos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'advogado') AND advogado_responsavel = auth.uid());
CREATE POLICY "Processos: advogado atualiza os seus" ON public.processos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'advogado') AND advogado_responsavel = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'advogado') AND advogado_responsavel = auth.uid());
CREATE POLICY "Processos: advogado cria como responsável" ON public.processos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'advogado') AND advogado_responsavel = auth.uid());

CREATE POLICY "Tarefas: admin total" ON public.prazos_e_tarefas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Tarefas: advogado lê" ON public.prazos_e_tarefas FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'advogado') AND (
    responsavel_id = auth.uid() OR criado_por = auth.uid()
    OR (processo_id IS NOT NULL AND public.can_access_processo(auth.uid(), processo_id))));
CREATE POLICY "Tarefas: advogado atualiza" ON public.prazos_e_tarefas FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'advogado') AND (
    responsavel_id = auth.uid() OR criado_por = auth.uid()
    OR (processo_id IS NOT NULL AND public.can_access_processo(auth.uid(), processo_id))))
  WITH CHECK (public.has_role(auth.uid(), 'advogado'));
CREATE POLICY "Tarefas: advogado cria" ON public.prazos_e_tarefas FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'advogado') AND criado_por = auth.uid() AND (
    processo_id IS NULL OR public.can_access_processo(auth.uid(), processo_id)));

CREATE POLICY "Pastas: admin total" ON public.pastas_digitais FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Pastas: advogado lê" ON public.pastas_digitais FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'advogado') AND (
    uploader_id = auth.uid() OR public.can_access_processo(auth.uid(), processo_id)));
CREATE POLICY "Pastas: advogado atualiza os seus" ON public.pastas_digitais FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'advogado') AND uploader_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'advogado') AND uploader_id = auth.uid());
CREATE POLICY "Pastas: advogado envia" ON public.pastas_digitais FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'advogado') AND uploader_id = auth.uid()
    AND public.can_access_processo(auth.uid(), processo_id));

CREATE POLICY "Todos leem a identidade do sistema"
  ON public.configuracoes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Somente admin altera a identidade do sistema"
  ON public.configuracoes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

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

CREATE POLICY "Categorias: equipe lê" ON public.categorias_financeiras
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Categorias: admin total" ON public.categorias_financeiras
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

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

CREATE POLICY "Pasta digital: ler arquivos do processo" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'pastas-digitais' AND public.can_access_processo_path(auth.uid(), (storage.foldername(name))[1]));
CREATE POLICY "Pasta digital: enviar arquivos ao processo" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pastas-digitais' AND public.is_staff(auth.uid())
    AND public.can_access_processo_path(auth.uid(), (storage.foldername(name))[1]));
CREATE POLICY "Pasta digital: admin remove arquivos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'pastas-digitais' AND public.has_role(auth.uid(), 'admin'));

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
