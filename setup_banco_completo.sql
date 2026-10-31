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


-- ==============================================================
-- CARGA DE DADOS INICIAL: 63 PROCESSOS E CLIENTES
-- ==============================================================
-- ==============================================================
-- SCRIPT DE IMPORTAÇÃO DE PROCESSOS E CLIENTES - PROJUS
-- Gerado a partir de processos.xlsx (63 processos, 57 clientes)
-- ==============================================================
BEGIN;

DO $$
DECLARE
  v_advogado_id uuid;
  v_cliente_id uuid;
  v_processo_id uuid;
  v_total_clientes int := 0;
  v_total_processos int := 0;
BEGIN
  -- Identifica o primeiro advogado ou admin cadastrado na equipe para associar os processos (se houver)
  SELECT id INTO v_advogado_id FROM public.perfis LIMIT 1;

  -- [1] Abadan Karista - 0802787-22.2025.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Abadan Karista') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Abadan Karista', 'IMP-0001', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0802787-22.2025.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Protesto Indevido de Título',
      '0802787-22.2025.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Juizado Especial Cível (JEC)',
      'Recursal',
      'PJe',
      'SENTENÇA IMPROCEDENTE',
      'Ação: Protesto Indevido de Título | Providência: REMETIDO AO SEGUNDO GRAU | Prazo: PROTOCOLADO RECURSO',
      v_advogado_id,
      '2025-10-14 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2025-10-14'::date,
      'SENTENÇA IMPROCEDENTE (Providência: REMETIDO AO SEGUNDO GRAU)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [2] Adamor - 0803593-57.2025.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Adamor') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Adamor', 'IMP-0002', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0803593-57.2025.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Dano Moral e Material',
      '0803593-57.2025.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara Cível',
      'Conhecimento',
      'PJe',
      'Aguardando conclusão',
      'Ação: Dano Moral e Material | Providência: Solicitar andamento pelo balcão virtual',
      v_advogado_id,
      '2026-10-14 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-10-14'::date,
      'Aguardando conclusão (Providência: Solicitar andamento pelo balcão virtual)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [3] Ana Beatriz Bezze - 0803916-96.2024.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Ana Beatriz Bezze') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Ana Beatriz Bezze', 'IMP-0003', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0803916-96.2024.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'EXECUÇÃO DE ALIMENTOS (RITO PRISÃO)',
      '0803916-96.2024.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara de Família',
      'Execução',
      'PJe',
      'APRESENTADA PLANILHA ATUALIZADA',
      'Ação: EXECUÇÃO DE ALIMENTOS (RITO PRISÃO) | Providência: APRESENTADA PLANILHA ATUALIZADA',
      v_advogado_id,
      '2026-10-14 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-10-14'::date,
      '(Providência: APRESENTADA PLANILHA ATUALIZADA)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [4] Ana Beatriz Bezze - 0803909-07.2024.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Ana Beatriz Bezze') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Ana Beatriz Bezze', 'IMP-0003', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0803909-07.2024.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'EXECUÇÃO DE ALIMENTOS (RITO DE PENHORA)',
      '0803909-07.2024.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara de Família',
      'Execução',
      'PJe',
      'AGUARDANDO DILIGêNCIAS',
      'Ação: EXECUÇÃO DE ALIMENTOS (RITO DE PENHORA) | Providência: AGUARDANDO DILIGêNCIAS',
      v_advogado_id,
      '2026-10-14 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-10-14'::date,
      '(Providência: AGUARDANDO DILIGêNCIAS)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [5] Ana Maria Machado - 5000173-69.2025.4.02.5108
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Ana Maria Machado') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Ana Maria Machado', 'IMP-0004', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '5000173-69.2025.4.02.5108' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Pensão Militar',
      '5000173-69.2025.4.02.5108',
      'TRF2',
      'São Pedro da Aldeia',
      'Vara Federal',
      'Conhecimento',
      'eproc',
      NULL,
      'Ação: Pensão Militar',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

  END IF;

  -- [6] Andreia - 0804439-11.2024.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Andreia') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Andreia', 'IMP-0005', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0804439-11.2024.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Modificação de Guarda',
      '0804439-11.2024.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara de Família',
      'Conhecimento',
      'PJe',
      'conclusão',
      'Ação: Modificação de Guarda | Providência: conclusão | Prazo: conclusão',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: conclusão)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [7] Andressa - 0804342-74.2025.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Andressa') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Andressa', 'IMP-0006', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0804342-74.2025.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Modificação de Guarda',
      '0804342-74.2025.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara de Família',
      'Conhecimento',
      'PJe',
      NULL,
      'Ação: Modificação de Guarda',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

  END IF;

  -- [8] Antony - 0800311-03.2024.8.19.0069
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Antony') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Antony', 'IMP-0007', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0800311-03.2024.8.19.0069' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Exoneração de alimentos',
      '0800311-03.2024.8.19.0069',
      'TJRJ',
      'Iguaba Grande',
      'Vara de Família',
      'Conhecimento',
      'PJe',
      'Manifestação da autora',
      'Ação: Exoneração de alimentos | Providência: Manifestação da autora',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: Manifestação da autora)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [9] Antony - 0800079-88.2024.8.19.0069
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Antony') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Antony', 'IMP-0007', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0800079-88.2024.8.19.0069' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Alimentos',
      '0800079-88.2024.8.19.0069',
      'TJRJ',
      'Iguaba Grande',
      'Vara de Família',
      'Arquivado',
      'PJe',
      'ARQUIVADO',
      'Ação: Alimentos | Providência: ARQUIVADO',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: ARQUIVADO)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [10] Antony - 0800109-26.2024.8.19.0069
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Antony') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Antony', 'IMP-0007', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0800109-26.2024.8.19.0069' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'AÇÃO DE GUARDA',
      '0800109-26.2024.8.19.0069',
      'TJRJ',
      'Iguaba Grande',
      'Vara de Família',
      'Conhecimento',
      'eproc',
      'Aguardando',
      'Ação: AÇÃO DE GUARDA',
      v_advogado_id,
      '2026-10-05 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-10-05'::date,
      'Aguardando',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [11] Augusto - 0814863-57.2025.8.14.0301
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Augusto') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Augusto', 'IMP-0008', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0814863-57.2025.8.14.0301' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Reconhecimento de União Estável',
      '0814863-57.2025.8.14.0301',
      'TJPA',
      'Belém',
      'Vara de Família',
      'Sentença',
      'PJe',
      'SENTENÇA FAVORÁVEL',
      'Ação: Reconhecimento de União Estável | Providência: SENTENÇA FAVORÁVEL',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: SENTENÇA FAVORÁVEL)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [12] Beatriz Pinheiro - 0804982-77.2025.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Beatriz Pinheiro') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Beatriz Pinheiro', 'IMP-0009', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0804982-77.2025.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Alimentos',
      '0804982-77.2025.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara de Família',
      'Conhecimento',
      'PJe',
      NULL,
      'Ação: Alimentos',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

  END IF;

  -- [13] Beatriz queiroz - 0006726-14.2023.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Beatriz queiroz') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Beatriz queiroz', 'IMP-0010', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0006726-14.2023.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Execução Fiscal',
      '0006726-14.2023.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara de Execução Fiscal',
      'Execução',
      'eproc',
      NULL,
      'Ação: Execução Fiscal',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

  END IF;

  -- [14] BEATRIZ Queiroz - 3000935-42.2025.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('BEATRIZ Queiroz') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('BEATRIZ Queiroz', 'IMP-0010', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '3000935-42.2025.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Processo 3000935-42.2025.8.19.0055',
      '3000935-42.2025.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara de Execução Fiscal',
      'Conhecimento',
      'eproc',
      NULL,
      'Prazo: VERDE',
      v_advogado_id,
      '2026-10-07 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

  END IF;

  -- [15] Bianca Diniz - 0803088-04.2025.8.19.0011
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Bianca Diniz') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Bianca Diniz', 'IMP-0011', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0803088-04.2025.8.19.0011' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Acidente de Trânsito',
      '0803088-04.2025.8.19.0011',
      'TJRJ',
      'Cabo Frio',
      'Vara Cível',
      'Arquivado',
      'PJe',
      'ARQUIVADO',
      'Ação: Acidente de Trânsito | Providência: ARQUIVADO',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: ARQUIVADO)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [16] Bianca Diniz - 0800637-68.2025.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Bianca Diniz') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Bianca Diniz', 'IMP-0011', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0800637-68.2025.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Execução de título executível',
      '0800637-68.2025.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara Cível',
      'Execução',
      'eproc',
      'PROTOCOLADA PET. IMPULSO',
      'Ação: Execução de título executível | Providência: concluso ao juiz | Prazo: AMARALO/CRITERIOSA EXTREMO',
      v_advogado_id,
      '2026-10-20 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-10-20'::date,
      'PROTOCOLADA PET. IMPULSO (Providência: concluso ao juiz)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [17] CESAR - 0801033-45.2025.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('CESAR') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('CESAR', 'IMP-0012', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0801033-45.2025.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Repetição de Indébito',
      '0801033-45.2025.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara Cível',
      'Conhecimento',
      'PJe',
      'PARADO DESDE 6 D EJULHO',
      'Ação: Repetição de Indébito | Providência: IMPULSIONAR',
      v_advogado_id,
      '2026-10-21 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-10-21'::date,
      'PARADO DESDE 6 D EJULHO (Providência: IMPULSIONAR)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [18] Cleber - 0803993-42.2023.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Cleber') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Cleber', 'IMP-0013', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0803993-42.2023.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Declaração de Ausência',
      '0803993-42.2023.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara Cível',
      'Conhecimento',
      'PJe',
      'IMPULSIONAR',
      'Ação: Declaração de Ausência | Providência: IMPULSIONAR',
      v_advogado_id,
      '2026-10-05 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-10-05'::date,
      '(Providência: IMPULSIONAR)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [19] Clis de Sousa - 0004156-26.2021.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Clis de Sousa') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Clis de Sousa', 'IMP-0014', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0004156-26.2021.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Rescisão Contratual',
      '0004156-26.2021.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara Cível',
      'Conhecimento',
      'eproc',
      'IMPULSIONAR',
      'Ação: Rescisão Contratual | Providência: IMPULSIONAR',
      v_advogado_id,
      '2026-10-05 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-10-05'::date,
      '(Providência: IMPULSIONAR)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [20] DAVI/ DANIELA/ NOVA - 0803637-40.2025.8.19.0067
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('DAVI/ DANIELA/ NOVA') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('DAVI/ DANIELA/ NOVA', 'IMP-0015', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0803637-40.2025.8.19.0067' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Alimentos',
      '0803637-40.2025.8.19.0067',
      'TJRJ',
      'Queimados',
      'Vara de Família',
      'Conhecimento',
      'PJe',
      'Aguardando assinatura de acordo.',
      'Ação: Alimentos | Providência: Manifestação MP | Prazo: VERDE',
      v_advogado_id,
      '2026-10-20 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-10-20'::date,
      'Aguardando assinatura de acordo. (Providência: Manifestação MP)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [21] DHANAT KELLER - 0805472-02.2025.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('DHANAT KELLER') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('DHANAT KELLER', 'IMP-0016', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0805472-02.2025.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'REVISIONAL DE ALIMENTOS',
      '0805472-02.2025.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara de Família',
      'Conhecimento',
      'PJe',
      'MANIFESTAÇÃO MP',
      'Ação: REVISIONAL DE ALIMENTOS | Providência: MANIFESTAÇÃO MP',
      v_advogado_id,
      '2026-10-20 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-10-20'::date,
      '(Providência: MANIFESTAÇÃO MP)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [22] ELIZABETH - 0802059-15.2024.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('ELIZABETH') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('ELIZABETH', 'IMP-0017', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0802059-15.2024.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Repetição de Indébito',
      '0802059-15.2024.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara Cível',
      'Conhecimento',
      'PJe',
      'retorno de agravo',
      'Ação: Repetição de Indébito | Providência: retorno de agravo',
      v_advogado_id,
      '2026-10-05 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-10-05'::date,
      '(Providência: retorno de agravo)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [23] FÁBIO SILVA DA ROCHA - 0010131-61.2019.8.19.0067
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('FÁBIO SILVA DA ROCHA') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('FÁBIO SILVA DA ROCHA', 'IMP-0018', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0010131-61.2019.8.19.0067' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Despesas Condominiais',
      '0010131-61.2019.8.19.0067',
      'TJRJ',
      'Queimados',
      'Vara Cível',
      'Conhecimento',
      'eproc',
      'Aguardando conclusão',
      'Ação: Despesas Condominiais | Providência: Aguardando conclusão',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: Aguardando conclusão)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [24] GABRIEL - 0806730-18.2023.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('GABRIEL') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('GABRIEL', 'IMP-0019', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0806730-18.2023.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Cumprimento de Sentença',
      '0806730-18.2023.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara de Família',
      'Cumprimento de Sentença',
      'PJe',
      'Protocoladoofício assinado.',
      'Ação: Cumprimento de Sentença',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      'Protocoladoofício assinado.',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [25] INACIO - 0817494-30.2025.8.19.0011
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('INACIO') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('INACIO', 'IMP-0020', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0817494-30.2025.8.19.0011' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Danos Morais e Materiais',
      '0817494-30.2025.8.19.0011',
      'TJRJ',
      'Cabo Frio',
      'Vara Cível',
      'Conhecimento',
      'PJe',
      'Concedida a gratuidade',
      'Ação: Danos Morais e Materiais | Providência: Sem manifestação do Banco/ Requereu os efeitos da Revelia.',
      v_advogado_id,
      '2026-06-14 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-06-14'::date,
      'Concedida a gratuidade (Providência: Sem manifestação do Banco/ Requereu os efeitos da Revelia.)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [26] JORGE DE SOLANGE - 0804713-38.2025.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('JORGE DE SOLANGE') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('JORGE DE SOLANGE', 'IMP-0021', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0804713-38.2025.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Ação Anulatória',
      '0804713-38.2025.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara Cível',
      'Conhecimento',
      'PJe',
      'Aguardando conclusão',
      'Ação: Ação Anulatória | Providência: Aguardando conclusão',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: Aguardando conclusão)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [27] JOSE COSTA - 0813164-87.2025.8.19.0011
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('JOSE COSTA') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('JOSE COSTA', 'IMP-0022', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0813164-87.2025.8.19.0011' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Empréstimo Consignado',
      '0813164-87.2025.8.19.0011',
      'TJRJ',
      'Cabo Frio',
      'Vara Cível',
      'Conhecimento',
      'PJe',
      NULL,
      'Ação: Empréstimo Consignado',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

  END IF;

  -- [28] JOSE RONALD - 0804704-77.2026.8.19.0011
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('JOSE RONALD') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('JOSE RONALD', 'IMP-0023', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0804704-77.2026.8.19.0011' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Danos morais e materias',
      '0804704-77.2026.8.19.0011',
      'TJRJ',
      'Cabo Frio',
      'Vara de Família',
      'Conhecimento',
      'PJe',
      'Protocolo de documentos para JG.',
      'Ação: Danos morais e materias | Providência: Aguardando conclusão',
      v_advogado_id,
      '2026-10-21 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-10-21'::date,
      'Protocolo de documentos para JG. (Providência: Aguardando conclusão)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [29] JULIA E GUILHERME - 0000946-30.2022.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('JULIA E GUILHERME') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('JULIA E GUILHERME', 'IMP-0024', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0000946-30.2022.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Revisão de Alimentos',
      '0000946-30.2022.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara de Família',
      'Arquivado',
      'eproc',
      'ARQUIVADO',
      'Ação: Revisão de Alimentos | Providência: ARQUIVADO',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: ARQUIVADO)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [30] Kathryn Andrade - 0800531-77.2023.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Kathryn Andrade') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Kathryn Andrade', 'IMP-0025', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0800531-77.2023.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Guarda',
      '0800531-77.2023.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara de Família',
      'Conhecimento',
      'PJe',
      'Iniciação da visitação assitida',
      'Ação: Guarda | Providência: Iniciação da visitação assitida',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: Iniciação da visitação assitida)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [31] LAURA BASTOS ENEL - 0803176-41.2024.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('LAURA BASTOS ENEL') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('LAURA BASTOS ENEL', 'IMP-0026', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0803176-41.2024.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Repetição de Indébito',
      '0803176-41.2024.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara Cível',
      'Conhecimento',
      'PJe',
      'Agurdando tranferÊncia de valores.',
      'Ação: Repetição de Indébito | Providência: Agurdando tranferÊncia de valores.',
      v_advogado_id,
      '2026-10-20 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-10-20'::date,
      '(Providência: Agurdando tranferÊncia de valores.)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [32] MANOEL - 0804747-13.2025.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('MANOEL') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('MANOEL', 'IMP-0027', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0804747-13.2025.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Inventário',
      '0804747-13.2025.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara de Família',
      'Conhecimento',
      'PJe',
      'Levantar certidões',
      'Ação: Inventário | Providência: Levantar certidões',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: Levantar certidões)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [33] MARCUS VINÍCIUS (réu) - 0803989-40.2023.8.19.0011
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('MARCUS VINÍCIUS (réu)') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('MARCUS VINÍCIUS (réu)', 'IMP-0028', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0803989-40.2023.8.19.0011' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Execução Alimentos',
      '0803989-40.2023.8.19.0011',
      'TJRJ',
      'Cabo Frio',
      'Vara de Família',
      'Execução',
      'PJe',
      'Aguardando manifestação do juízo',
      'Ação: Execução Alimentos | Providência: Aguardando manifestação do juízo',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: Aguardando manifestação do juízo)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [34] Maria da conceição - 5007518-23.2024.4.02.5108
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Maria da conceição') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Maria da conceição', 'IMP-0029', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '5007518-23.2024.4.02.5108' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Descontos Indevidos',
      '5007518-23.2024.4.02.5108',
      'TRF2',
      'São Pedro da Aldeia',
      'Vara Federal',
      'Conhecimento',
      'eproc',
      'PRAZO FINAL: 13/07',
      'Ação: Descontos Indevidos | Providência: Aguardando decorrer prazo recursal.',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      'PRAZO FINAL: 13/07 (Providência: Aguardando decorrer prazo recursal.)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [35] MEL - 0803572-81.2025.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('MEL') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('MEL', 'IMP-0030', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0803572-81.2025.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Danos Morais e Materiais',
      '0803572-81.2025.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Juizado Especial Cível (JEC)',
      'Sentença',
      'PJe',
      'SENTENÇA: 22/07/2026',
      'Ação: Danos Morais e Materiais | Providência: SENTENÇA: 22/07/2026',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: SENTENÇA: 22/07/2026)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [36] NATÁLIA/ANDRÉIA/ pamela - 0806597-73.2023.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('NATÁLIA/ANDRÉIA/ pamela') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('NATÁLIA/ANDRÉIA/ pamela', 'IMP-0031', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0806597-73.2023.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Alimentos',
      '0806597-73.2023.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara de Família',
      'Conhecimento',
      'PJe',
      'Aguardando a manifestação',
      'Ação: Alimentos | Providência: Aguardando a manifestação',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: Aguardando a manifestação)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [37] NICOLE - 0806397-95.2025.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('NICOLE') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('NICOLE', 'IMP-0032', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0806397-95.2025.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'AÇÃO DE ABANDONO AFETIVO',
      '0806397-95.2025.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara de Família',
      'Conhecimento',
      'PJe',
      'Réplica a Contestação',
      'Ação: AÇÃO DE ABANDONO AFETIVO | Providência: concluso',
      v_advogado_id,
      '2026-10-20 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-10-20'::date,
      'Réplica a Contestação (Providência: concluso)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [38] POLYANNA - 0801055-06.2025.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('POLYANNA') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('POLYANNA', 'IMP-0033', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0801055-06.2025.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Alimentos',
      '0801055-06.2025.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara de Família',
      'Conhecimento',
      'PJe',
      'Aguardando',
      'Ação: Alimentos | Providência: Aguardando',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: Aguardando)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [39] RAIANNY/KEYLLA - 0802120-70.2024.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('RAIANNY/KEYLLA') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('RAIANNY/KEYLLA', 'IMP-0034', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0802120-70.2024.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Alimentos',
      '0802120-70.2024.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara de Família',
      'Conhecimento',
      'PJe',
      'RENÚNCIA',
      'Ação: Alimentos | Providência: RENÚNCIA',
      v_advogado_id,
      '2026-09-22 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-09-22'::date,
      '(Providência: RENÚNCIA)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [40] RENATO - 0003855-94.2012.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('RENATO') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('RENATO', 'IMP-0035', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0003855-94.2012.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Despesas Condominiais',
      '0003855-94.2012.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara Cível',
      'Recursal',
      'eproc',
      'Recurso de Apelação',
      'Ação: Despesas Condominiais | Providência: Recurso de Apelação',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: Recurso de Apelação)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [41] ROBERTA - 0804740-55.2024.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('ROBERTA') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('ROBERTA', 'IMP-0036', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0804740-55.2024.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Acidente de Trânsito',
      '0804740-55.2024.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara Cível',
      'Conhecimento',
      'PJe',
      'Aguardando conclusão',
      'Ação: Acidente de Trânsito | Providência: Aguardando conclusão',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: Aguardando conclusão)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [42] ROSANGELA ESTERQUE DE ASSIS - 0824056-91.2023.8.19.0054
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('ROSANGELA ESTERQUE DE ASSIS') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('ROSANGELA ESTERQUE DE ASSIS', 'IMP-0037', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0824056-91.2023.8.19.0054' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Interdição/Curatela',
      '0824056-91.2023.8.19.0054',
      'TJRJ',
      'Santa Maria Madalena',
      'Vara de Família',
      'Conhecimento',
      'eproc',
      'Aguardando conclusão',
      'Ação: Interdição/Curatela | Providência: Aguardando conclusão',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: Aguardando conclusão)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [43] SHEILA MONTE DIVORCIO - 0808232-30.2025.8.19.0052
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('SHEILA MONTE DIVORCIO') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('SHEILA MONTE DIVORCIO', 'IMP-0038', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0808232-30.2025.8.19.0052' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Divórcio',
      '0808232-30.2025.8.19.0052',
      'TJRJ',
      'São Pedro da Aldeia',
      'Vara de Família',
      'Arquivado',
      'eproc',
      'ARQUIVADO/BAIXA',
      'Ação: Divórcio | Providência: ARQUIVADO/BAIXA',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: ARQUIVADO/BAIXA)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [44] SHIRLE PAVAO - 0804892-69.2025.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('SHIRLE PAVAO') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('SHIRLE PAVAO', 'IMP-0039', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0804892-69.2025.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Empréstimo Consignado',
      '0804892-69.2025.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara Cível',
      'Conhecimento',
      'PJe',
      'Tutela concedida R$ 3.039',
      'Ação: Empréstimo Consignado | Providência: RÉPLICA APRESENTADA',
      v_advogado_id,
      '2026-03-23 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-03-23'::date,
      'Tutela concedida R$ 3.039 (Providência: RÉPLICA APRESENTADA)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [45] SORAYA CARDOSO - 5005530-30.2025.4.02.5108
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('SORAYA CARDOSO') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('SORAYA CARDOSO', 'IMP-0040', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '5005530-30.2025.4.02.5108' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Pensão por Morte',
      '5005530-30.2025.4.02.5108',
      'TRF2',
      'São Pedro da Aldeia',
      'Vara Federal',
      'Conhecimento',
      'eproc',
      NULL,
      'Ação: Pensão por Morte',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

  END IF;

  -- [46] SORAYA INVENTÁRIO - 0140520-58.2016.4.02.5108
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('SORAYA INVENTÁRIO') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('SORAYA INVENTÁRIO', 'IMP-0041', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0140520-58.2016.4.02.5108' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'indenizatória',
      '0140520-58.2016.4.02.5108',
      'TRF2',
      'São Pedro da Aldeia',
      'Vara Federal',
      'Conhecimento',
      'eproc',
      NULL,
      'Ação: indenizatória',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

  END IF;

  -- [47] TAISA - 0801519-30.2025.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('TAISA') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('TAISA', 'IMP-0042', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0801519-30.2025.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Ação de Cobrança',
      '0801519-30.2025.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara Cível',
      'Conhecimento',
      'PJe',
      'REQUER HOMOLOGAÇÃO ACORDO',
      'Ação: Ação de Cobrança | Providência: REQUER HOMOLOGAÇÃO ACORDO',
      v_advogado_id,
      '2026-08-25 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-08-25'::date,
      '(Providência: REQUER HOMOLOGAÇÃO ACORDO)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [48] TATIANE FENO - 0801071-28.2023.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('TATIANE FENO') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('TATIANE FENO', 'IMP-0043', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0801071-28.2023.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Declaratória de Inexistência de Débito',
      '0801071-28.2023.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Juizado Especial Cível (JEC)',
      'Instrução',
      'PJe',
      'Aguardando agendar audiência',
      'Ação: Declaratória de Inexistência de Débito | Providência: Aguardando agendar audiência',
      v_advogado_id,
      '2026-07-06 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-07-06'::date,
      '(Providência: Aguardando agendar audiência)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [49] VALERIA SILVA DA CRUZ - 0813711-30.2025.8.19.0011
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('VALERIA SILVA DA CRUZ') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('VALERIA SILVA DA CRUZ', 'IMP-0044', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0813711-30.2025.8.19.0011' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Empréstimo Consignado',
      '0813711-30.2025.8.19.0011',
      'TJRJ',
      'Cabo Frio',
      'Vara Cível',
      'Conhecimento',
      'PJe',
      'RÉPLICA APRESENTADA',
      'Ação: Empréstimo Consignado | Providência: RÉPLICA APRESENTADA',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: RÉPLICA APRESENTADA)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [50] YVISIO - 0800150-98.2025.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('YVISIO') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('YVISIO', 'IMP-0045', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0800150-98.2025.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Repetição de Indébito',
      '0800150-98.2025.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Juizado Especial Cível (JEC)',
      'Recursal',
      'PJe',
      'Recurso inominado',
      'Ação: Repetição de Indébito | Providência: Solicitar andamento pelo balcão virtual',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      'Recurso inominado (Providência: Solicitar andamento pelo balcão virtual)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [51] KAROLINE - 3001044-22.2026.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('KAROLINE') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('KAROLINE', 'IMP-0046', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '3001044-22.2026.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Processo 3001044-22.2026.8.19.0055',
      '3001044-22.2026.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara Cível',
      'Conhecimento',
      'eproc',
      'TUTELA CONCEDIDA',
      'Providência: RÉPLICA APRESENTADA',
      v_advogado_id,
      '2026-07-24 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-07-24'::date,
      'TUTELA CONCEDIDA (Providência: RÉPLICA APRESENTADA)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [52] CAIO - 0800263-18.2026.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('CAIO') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('CAIO', 'IMP-0047', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0800263-18.2026.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Processo 0800263-18.2026.8.19.0055',
      '0800263-18.2026.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Juizado Especial Cível (JEC)',
      'Conhecimento',
      'PJe',
      'CONCLUSO',
      'Providência: AIJ 3/11/2026',
      v_advogado_id,
      '2026-09-21 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-09-21'::date,
      'CONCLUSO (Providência: AIJ 3/11/2026)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [53] JORGE X ATACADÃO - 3000155-68.2026.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('JORGE X ATACADÃO') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('JORGE X ATACADÃO', 'IMP-0048', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '3000155-68.2026.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Processo 3000155-68.2026.8.19.0055',
      '3000155-68.2026.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara Cível',
      'Conhecimento',
      'eproc',
      'CONCLUSO AO JUIZ',
      'Providência: CONCLUSO AO JUIZ',
      v_advogado_id,
      '2026-07-24 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-07-24'::date,
      '(Providência: CONCLUSO AO JUIZ)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [54] Danielle/Execução honorários - 3001430-52.2026.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Danielle/Execução honorários') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Danielle/Execução honorários', 'IMP-0049', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '3001430-52.2026.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Processo 3001430-52.2026.8.19.0055',
      '3001430-52.2026.8.19.0055',
      'TJRJ',
      'Saquarema',
      NULL,
      'Conhecimento',
      'eproc',
      'Aguardando intimação',
      'Providência: Aguardando intimação',
      v_advogado_id,
      '2026-10-20 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-10-20'::date,
      '(Providência: Aguardando intimação)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [55] YGOR PESSANHA - 0801118-70.2021.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('YGOR PESSANHA') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('YGOR PESSANHA', 'IMP-0050', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0801118-70.2021.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Processo 0801118-70.2021.8.19.0055',
      '0801118-70.2021.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Juizado Especial Cível (JEC)',
      'Conhecimento',
      'PJe',
      'CONCLUSO AO JUIZ',
      'Providência: CONCLUSO AO JUIZ',
      v_advogado_id,
      '2026-07-12 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-07-12'::date,
      '(Providência: CONCLUSO AO JUIZ)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [56] Giovanna (Kathryn) - 3001450-43.2026.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Giovanna (Kathryn)') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Giovanna (Kathryn)', 'IMP-0051', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '3001450-43.2026.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Processo 3001450-43.2026.8.19.0055',
      '3001450-43.2026.8.19.0055',
      'TJRJ',
      'Saquarema',
      'Vara de Família',
      'Conhecimento',
      'eproc',
      'RENÚNCIA AO MANDADO',
      'Providência: RENÚNCIA AO MANDADO',
      v_advogado_id,
      '2026-10-20 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-10-20'::date,
      '(Providência: RENÚNCIA AO MANDADO)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [57] SORAIA X INSS - 0140520-58.2016.4.02.5108
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('SORAIA X INSS') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('SORAIA X INSS', 'IMP-0052', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0140520-58.2016.4.02.5108' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Processo 0140520-58.2016.4.02.5108',
      '0140520-58.2016.4.02.5108',
      'TRF2',
      'São Pedro da Aldeia',
      'Vara Federal',
      'Conhecimento',
      NULL,
      NULL,
      NULL,
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

  END IF;

  -- [58] IARA X PROLAGOS - 3005311-72.2026.8.19.0011
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('IARA X PROLAGOS') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('IARA X PROLAGOS', 'IMP-0053', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '3005311-72.2026.8.19.0011' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Processo 3005311-72.2026.8.19.0011',
      '3005311-72.2026.8.19.0011',
      'TJRJ',
      'Cabo Frio',
      'Vara Cível',
      'Conhecimento',
      'eproc',
      'IMPULSIONAR',
      'Providência: IMPULSIONAR',
      v_advogado_id,
      '2026-09-14 12:00:00+00'::timestamptz
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      '2026-09-14'::date,
      '(Providência: IMPULSIONAR)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [59] Maria da conceição - Sem CNJ
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('Maria da conceição') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('Maria da conceição', 'IMP-0029', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE cliente_id = v_cliente_id AND titulo = 'Processo de Maria da conceição' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Processo de Maria da conceição',
      NULL,
      NULL,
      NULL,
      NULL,
      'Conhecimento',
      NULL,
      NULL,
      NULL,
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

  END IF;

  -- [60] MICHELE RABELO - 3000155-68.2026.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('MICHELE RABELO') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('MICHELE RABELO', 'IMP-0054', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '3000155-68.2026.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Processo 3000155-68.2026.8.19.0055',
      '3000155-68.2026.8.19.0055',
      'TJRJ',
      'Saquarema',
      NULL,
      'Conhecimento',
      NULL,
      'PENDêNCIAS DE CERTIDÕES',
      'Providência: PENDêNCIAS DE CERTIDÕES',
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

    -- 3. Inserir no histórico de movimentações
    INSERT INTO public.processo_movimentacoes (
      processo_id,
      data_movimentacao,
      descricao,
      autor_id,
      created_at
    ) VALUES (
      v_processo_id,
      CURRENT_DATE,
      '(Providência: PENDêNCIAS DE CERTIDÕES)',
      v_advogado_id,
      NOW()
    );
  END IF;

  -- [61] ROGÉRIO E LUCIANA - 0804342-74.2025.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('ROGÉRIO E LUCIANA') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('ROGÉRIO E LUCIANA', 'IMP-0055', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0804342-74.2025.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Processo 0804342-74.2025.8.19.0055',
      '0804342-74.2025.8.19.0055',
      'TJRJ',
      'Saquarema',
      NULL,
      'Conhecimento',
      'PJe',
      NULL,
      NULL,
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

  END IF;

  -- [62] CAIO FERNANDO DA CRUZ - 0800263-18.2026.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('CAIO FERNANDO DA CRUZ') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('CAIO FERNANDO DA CRUZ', 'IMP-0056', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0800263-18.2026.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Processo 0800263-18.2026.8.19.0055',
      '0800263-18.2026.8.19.0055',
      'TJRJ',
      'Saquarema',
      NULL,
      'Conhecimento',
      'PJe',
      NULL,
      NULL,
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

  END IF;

  -- [63] SORAIA X IMÓVEL - 0004079-37.2009.8.19.0055
  -- 1. Obter ou criar Cliente
  SELECT id INTO v_cliente_id FROM public.clientes WHERE LOWER(TRIM(nome)) = LOWER('SORAIA X IMÓVEL') LIMIT 1;
  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, documento, tipo, created_at)
    VALUES ('SORAIA X IMÓVEL', 'IMP-0057', 'Pessoa Física', NOW())
    RETURNING id INTO v_cliente_id;
    v_total_clientes := v_total_clientes + 1;
  END IF;

  -- 2. Inserir Processo se não existir
  SELECT id INTO v_processo_id FROM public.processos WHERE numero_cnj = '0004079-37.2009.8.19.0055' LIMIT 1;
  IF v_processo_id IS NULL THEN
    INSERT INTO public.processos (
      cliente_id,
      titulo,
      numero_cnj,
      tribunal,
      comarca,
      vara,
      fase_atual,
      sistema,
      andamento,
      descricao_acao,
      advogado_responsavel,
      created_at
    ) VALUES (
      v_cliente_id,
      'Processo 0004079-37.2009.8.19.0055',
      '0004079-37.2009.8.19.0055',
      'TJRJ',
      'Saquarema',
      'DCT',
      'Conhecimento',
      'Outro',
      NULL,
      NULL,
      v_advogado_id,
      NOW()
    ) RETURNING id INTO v_processo_id;
    v_total_processos := v_total_processos + 1;

  END IF;

  RAISE NOTICE 'Importação concluída: % clientes novos inseridos, % processos inseridos.', v_total_clientes, v_total_processos;
END $$;

COMMIT;