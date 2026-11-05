-- Instalação BASE em um projeto Supabase vazio, pelo SQL Editor (postgres).
-- Não executar sobre um banco existente: revisar o esquema e usar os scripts incrementais.
begin;
create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null check (length(trim(nome)) between 2 and 100),
  perfil text not null check (perfil in ('admin','voluntario','veterinario')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create table public.animais (
  id bigint generated always as identity primary key,
  nome text not null check (length(trim(nome)) >= 2),
  especie text not null check (especie in ('cao','gato')),
  sexo text not null check (sexo in ('macho','femea')),
  porte text not null check (porte in ('pequeno','medio','grande')),
  faixa_etaria text not null check (faixa_etaria in ('filhote','adulto','idoso')),
  temperamento text,
  convivencia_criancas boolean not null,
  convivencia_outros_animais boolean not null,
  situacao text not null default 'em tratamento' check (situacao in ('em tratamento','disponivel','adotado')),
  criado_em timestamptz not null default now()
);
create table public.adotantes (
  id bigint generated always as identity primary key,
  nome text not null check (length(trim(nome)) >= 3),
  email text not null unique,
  telefone text not null check (telefone ~ '^[0-9]{10,11}$'),
  endereco text,
  status text not null default 'em triagem' check (status in ('em triagem','aprovado','reprovado')),
  criado_em timestamptz not null default now()
);
create unique index adotantes_email_normalizado_idx on public.adotantes(lower(email));
create table public.adocoes (
  id bigint generated always as identity primary key,
  animal_id bigint not null unique references public.animais(id),
  adotante_id bigint not null references public.adotantes(id),
  data_adocao date not null,
  observacoes text,
  criado_em timestamptz not null default now()
);
create table public.resgates (
  id bigint generated always as identity primary key,
  animal_id bigint not null references public.animais(id),
  data_resgate date not null,
  local_resgate text not null,
  motivo text not null,
  observacoes text,
  criado_em timestamptz not null default now()
);
create table public.registros_saude (
  id bigint generated always as identity primary key,
  animal_id bigint not null references public.animais(id),
  data_registro date not null,
  descricao text not null,
  observacoes text,
  criado_em timestamptz not null default now()
);
create table public.vacinas (
  id bigint generated always as identity primary key,
  animal_id bigint not null references public.animais(id),
  nome text not null,
  data_aplicacao date not null,
  proxima_dose date check (proxima_dose >= data_aplicacao),
  observacoes text,
  criado_em timestamptz not null default now()
);
create table public.tratamentos (
  id bigint generated always as identity primary key,
  animal_id bigint not null references public.animais(id),
  descricao text not null,
  inicio date not null,
  fim date check (fim >= inicio),
  status text not null default 'ativo' check (status in ('ativo','concluido','cancelado')),
  observacoes text,
  criado_em timestamptz not null default now()
);
create index animais_situacao_criado_idx on public.animais(situacao, criado_em desc);
create index adotantes_status_idx on public.adotantes(status);
create index adocoes_adotante_idx on public.adocoes(adotante_id);
create index resgates_animal_idx on public.resgates(animal_id, criado_em desc);
create index saude_animal_idx on public.registros_saude(animal_id, criado_em desc);
create index vacinas_animal_idx on public.vacinas(animal_id, criado_em desc);
create index tratamentos_animal_idx on public.tratamentos(animal_id, criado_em desc);

-- Consulta de autorização fora do schema exposto; não aceita ID do cliente.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create function private.equipe_ativa() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.perfis
    where id = (select auth.uid()) and ativo
      and perfil in ('admin','voluntario','veterinario'));
$$;
revoke all on function private.equipe_ativa() from public, anon;
grant execute on function private.equipe_ativa() to authenticated;

alter table public.perfis enable row level security;
revoke all on public.perfis from anon, authenticated;
grant select on public.perfis to authenticated;
grant update(nome, atualizado_em) on public.perfis to authenticated;
grant all on public.perfis to service_role;
create policy perfil_proprio on public.perfis for select to authenticated using (id = (select auth.uid()));
create policy nome_proprio on public.perfis for update to authenticated
  using (id = (select auth.uid()) and ativo)
  with check (id = (select auth.uid()) and ativo);

do $$ declare tabela text; begin
  foreach tabela in array array['animais','adotantes','adocoes','resgates','registros_saude','vacinas','tratamentos'] loop
    execute format('alter table public.%I enable row level security', tabela);
    execute format('revoke all on public.%I from anon, authenticated', tabela);
    execute format('grant select, insert, update on public.%I to authenticated', tabela);
    execute format('grant all on public.%I to service_role', tabela);
    execute format('create policy equipe_consulta on public.%I for select to authenticated using ((select private.equipe_ativa()))', tabela);
    execute format('create policy equipe_insere on public.%I for insert to authenticated with check ((select private.equipe_ativa()))', tabela);
    execute format('create policy equipe_atualiza on public.%I for update to authenticated using ((select private.equipe_ativa())) with check ((select private.equipe_ativa()))', tabela);
  end loop;
end $$;
grant select on public.animais to anon;
create policy catalogo_publico on public.animais for select to anon using (situacao = 'disponivel');
grant usage, select on all sequences in schema public to authenticated, service_role;
commit;
