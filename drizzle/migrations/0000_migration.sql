-- ===== Papéis =====
create type public.app_role as enum ('admin', 'advogado', 'cliente');

-- ===== Perfis =====
create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome varchar(160) not null default '',
  email varchar(255),
  created_at timestamptz not null default now()
);
grant select, update on public.perfis to authenticated;
grant all on public.perfis to service_role;
alter table public.perfis enable row level security;

-- ===== Papéis do usuário (tabela separada para evitar escalonamento de privilégio) =====
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id)
);
grant select, insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

-- ===== Funções auxiliares (security definer, evitam recursão em RLS) =====
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','advogado'))
$$;

-- ===== Clientes =====
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome varchar(200) not null,
  documento varchar(20) not null unique,
  tipo varchar(20) not null default 'Pessoa Física',
  email varchar(255),
  telefone varchar(40),
  criado_por uuid default auth.uid(),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.clientes to authenticated;
grant all on public.clientes to service_role;
alter table public.clientes enable row level security;

-- ===== Processos =====
create table public.processos (
  id uuid primary key default gen_random_uuid(),
  numero_cnj varchar(32) not null,
  cliente_id uuid references public.clientes(id) on delete restrict,
  tribunal varchar(120),
  comarca varchar(120),
  vara varchar(160),
  fase_atual varchar(60) not null default 'Conhecimento',
  valor_causa numeric(14,2),
  advogado_responsavel uuid,
  created_at timestamptz not null default now()
);
create index processos_advogado_idx on public.processos(advogado_responsavel);
create index processos_cliente_idx on public.processos(cliente_id);
grant select, insert, update, delete on public.processos to authenticated;
grant all on public.processos to service_role;
alter table public.processos enable row level security;

create or replace function public.can_access_processo(_user_id uuid, _processo_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id, 'admin')
      or exists (select 1 from public.processos p where p.id = _processo_id and p.advogado_responsavel = _user_id)
$$;

-- ===== Prazos e tarefas =====
create table public.prazos_e_tarefas (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid references public.processos(id) on delete cascade,
  titulo varchar(200) not null,
  descricao text,
  data_fatal timestamptz not null,
  responsavel_id uuid,
  status varchar(20) not null default 'Pendente' check (status in ('Pendente','Em Andamento','Cumprido')),
  criado_por uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index tarefas_responsavel_idx on public.prazos_e_tarefas(responsavel_id);
create index tarefas_data_fatal_idx on public.prazos_e_tarefas(data_fatal);
grant select, insert, update, delete on public.prazos_e_tarefas to authenticated;
grant all on public.prazos_e_tarefas to service_role;
alter table public.prazos_e_tarefas enable row level security;

-- ===== Pastas digitais =====
create table public.pastas_digitais (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references public.processos(id) on delete cascade,
  nome_documento varchar(255) not null,
  arquivo_url text not null,
  tamanho_bytes bigint,
  data_upload timestamptz not null default now(),
  uploader_id uuid default auth.uid()
);
create index pastas_processo_idx on public.pastas_digitais(processo_id);
grant select, insert, update, delete on public.pastas_digitais to authenticated;
grant all on public.pastas_digitais to service_role;
alter table public.pastas_digitais enable row level security;

-- ===== Políticas: perfis =====
create policy "Perfis: ver o próprio ou equipe" on public.perfis for select to authenticated
  using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "Perfis: editar o próprio" on public.perfis for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "Perfis: admin edita todos" on public.perfis for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- ===== Políticas: user_roles =====
create policy "Papéis: ver o próprio ou equipe" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "Papéis: admin insere" on public.user_roles for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Papéis: admin altera" on public.user_roles for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Papéis: admin remove" on public.user_roles for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- ===== Políticas: clientes =====
create policy "Clientes: equipe lê" on public.clientes for select to authenticated
  using (public.is_staff(auth.uid()));
create policy "Clientes: equipe cria" on public.clientes for insert to authenticated
  with check (public.is_staff(auth.uid()) and criado_por = auth.uid());
create policy "Clientes: equipe edita" on public.clientes for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "Clientes: admin remove" on public.clientes for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- ===== Políticas: processos =====
create policy "Processos: admin total" on public.processos for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Processos: advogado lê os seus" on public.processos for select to authenticated
  using (public.has_role(auth.uid(), 'advogado') and advogado_responsavel = auth.uid());
create policy "Processos: advogado atualiza os seus" on public.processos for update to authenticated
  using (public.has_role(auth.uid(), 'advogado') and advogado_responsavel = auth.uid())
  with check (public.has_role(auth.uid(), 'advogado') and advogado_responsavel = auth.uid());
create policy "Processos: advogado cria como responsável" on public.processos for insert to authenticated
  with check (public.has_role(auth.uid(), 'advogado') and advogado_responsavel = auth.uid());

-- ===== Políticas: prazos e tarefas =====
create policy "Tarefas: admin total" on public.prazos_e_tarefas for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Tarefas: advogado lê" on public.prazos_e_tarefas for select to authenticated
  using (public.has_role(auth.uid(), 'advogado') and (
    responsavel_id = auth.uid() or criado_por = auth.uid()
    or (processo_id is not null and public.can_access_processo(auth.uid(), processo_id))));
create policy "Tarefas: advogado atualiza" on public.prazos_e_tarefas for update to authenticated
  using (public.has_role(auth.uid(), 'advogado') and (
    responsavel_id = auth.uid() or criado_por = auth.uid()
    or (processo_id is not null and public.can_access_processo(auth.uid(), processo_id))))
  with check (public.has_role(auth.uid(), 'advogado'));
create policy "Tarefas: advogado cria" on public.prazos_e_tarefas for insert to authenticated
  with check (public.has_role(auth.uid(), 'advogado') and criado_por = auth.uid() and (
    processo_id is null or public.can_access_processo(auth.uid(), processo_id)));

-- ===== Políticas: pastas digitais =====
create policy "Pastas: admin total" on public.pastas_digitais for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Pastas: advogado lê" on public.pastas_digitais for select to authenticated
  using (public.has_role(auth.uid(), 'advogado') and (
    uploader_id = auth.uid() or public.can_access_processo(auth.uid(), processo_id)));
create policy "Pastas: advogado atualiza os seus" on public.pastas_digitais for update to authenticated
  using (public.has_role(auth.uid(), 'advogado') and uploader_id = auth.uid())
  with check (public.has_role(auth.uid(), 'advogado') and uploader_id = auth.uid());
create policy "Pastas: advogado envia" on public.pastas_digitais for insert to authenticated
  with check (public.has_role(auth.uid(), 'advogado') and uploader_id = auth.uid()
    and public.can_access_processo(auth.uid(), processo_id));

-- ===== Criação automática de perfil e papel no cadastro =====
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, nome, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'nome', ''), nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    new.email
  );
  -- O primeiro usuário do sistema torna-se administrador; os demais começam como 'cliente'
  -- até que um administrador defina o papel.
  insert into public.user_roles (user_id, role)
  values (new.id, case when exists (select 1 from public.user_roles where role = 'admin') then 'cliente'::public.app_role else 'admin'::public.app_role end);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== Storage: acesso à pasta digital por processo =====
create or replace function public.can_access_processo_path(_user_id uuid, _folder text)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  return public.can_access_processo(_user_id, _folder::uuid);
exception when others then
  return false;
end;
$$;