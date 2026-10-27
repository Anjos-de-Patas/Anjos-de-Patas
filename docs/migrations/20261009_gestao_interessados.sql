-- Aplicar depois de 20261009_interesse_adocao.sql no SQL Editor do Supabase.
begin;
alter table public.adotantes add column if not exists etapa text not null default 'recebido';
alter table public.adotantes add column if not exists versao integer not null default 0;
alter table public.adotantes drop constraint if exists adotantes_etapa_check;
alter table public.adotantes add constraint adotantes_etapa_check check (etapa in ('recebido','triagem','entrevista','aprovado','concluida','encerrado'));
create table if not exists public.acompanhamento_eventos (
    id bigint generated always as identity primary key,
    adotante_id text not null,
    etapa text,
    tipo text not null check (tipo in ('etapa','contato','nota')),
    nota text not null default '',
    autor_id uuid,
    criado_em timestamptz not null default now()
);
create index if not exists acompanhamento_adotante_idx on public.acompanhamento_eventos(adotante_id, criado_em desc);
alter table public.acompanhamento_eventos enable row level security;
revoke all on public.acompanhamento_eventos from anon, authenticated;
grant all on public.acompanhamento_eventos to service_role;
grant usage, select on sequence public.acompanhamento_eventos_id_seq to service_role;

-- Migra apenas situações conhecidas; não inventa entrevistas anteriores.
update public.adotantes a set etapa = case
  when exists(select 1 from public.adocoes d where d.adotante_id::text=a.id::text) then 'concluida'
  when status='aprovado' then 'aprovado'
  when status='reprovado' then 'encerrado'
  else 'recebido' end where versao=0;
insert into public.acompanhamento_eventos(adotante_id,etapa,tipo)
select id::text,etapa,'etapa' from public.adotantes a
where not exists(select 1 from public.acompanhamento_eventos e where e.adotante_id=a.id::text);

create or replace function public.sincronizar_etapa_adotante() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if TG_OP='UPDATE' then
    if new.status is distinct from old.status and new.etapa=old.etapa then
      new.etapa := case when new.status='aprovado' then 'aprovado' when new.status='reprovado' then 'encerrado' else 'triagem' end;
    end if;
    if old.etapa='concluida' and new.etapa<>old.etapa then raise exception 'Adoção concluída' using errcode='P0001'; end if;
    if new.etapa is distinct from old.etapa or new.status is distinct from old.status then new.versao:=old.versao+1; end if;
  end if;
  if new.etapa='concluida' and not exists(select 1 from public.adocoes where adotante_id::text=new.id::text) then
    raise exception 'Registre a adoção antes de concluir' using errcode='P0001';
  end if;
  return new;
end $$;
create or replace function public.auditar_etapa_adotante() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if TG_OP='INSERT' then
    insert into public.acompanhamento_eventos(adotante_id,etapa,tipo,autor_id) values(new.id::text,new.etapa,'etapa',auth.uid());
  elsif new.etapa is distinct from old.etapa then
    insert into public.acompanhamento_eventos(adotante_id,etapa,tipo,autor_id)
    values(new.id::text,new.etapa,'etapa',coalesce(nullif(current_setting('anjos.autor',true),'')::uuid,auth.uid()));
  end if;
  return new;
end $$;
drop trigger if exists sincronizar_etapa on public.adotantes;
create trigger sincronizar_etapa before insert or update on public.adotantes for each row execute function public.sincronizar_etapa_adotante();
drop trigger if exists auditar_etapa on public.adotantes;
create trigger auditar_etapa after insert or update on public.adotantes for each row execute function public.auditar_etapa_adotante();

create or replace function public.concluir_acompanhamento_adocao() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  update public.adotantes set etapa='concluida',status='aprovado' where id::text=new.adotante_id::text;
  return new;
end $$;
drop trigger if exists concluir_acompanhamento on public.adocoes;
create trigger concluir_acompanhamento after insert on public.adocoes for each row execute function public.concluir_acompanhamento_adocao();

create or replace function public.registrar_acompanhamento(p_id text,p_versao integer,p_etapa text,p_tipo text,p_nota text,p_autor uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare atual public.adotantes%rowtype;
begin
  select * into atual from public.adotantes where id::text=p_id for update;
  if not found or atual.versao<>p_versao then raise exception 'Cadastro alterado' using errcode='40001'; end if;
  if p_tipo not in ('nota','contato') or length(p_nota)>3000 then raise exception 'Dados inválidos' using errcode='P0001'; end if;
  perform set_config('anjos.autor',p_autor::text,true);
  update public.adotantes set etapa=coalesce(p_etapa,etapa),versao=versao+1,
    status=case when p_etapa in ('aprovado','concluida') then 'aprovado' when p_etapa='encerrado' then 'reprovado' when p_etapa is not null then 'em triagem' else status end
    where id::text=p_id;
  if length(trim(p_nota))>0 then
    insert into public.acompanhamento_eventos(adotante_id,tipo,nota,autor_id) values(p_id,p_tipo,p_nota,p_autor);
  end if;
end $$;
revoke all on function public.registrar_acompanhamento(text,integer,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.registrar_acompanhamento(text,integer,text,text,text,uuid) to service_role;
revoke all on function public.sincronizar_etapa_adotante(),public.auditar_etapa_adotante(),public.concluir_acompanhamento_adocao() from public,anon,authenticated;

commit;
