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