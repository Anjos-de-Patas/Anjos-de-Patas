-- Revisar o esquema e as políticas existentes antes de executar.
-- Aplicar depois de docs/migrations/20261009_gestao_interessados.sql.
-- Compatível com IDs bigint ou uuid já existentes: os parâmetros são text.
begin;
create or replace function public.registrar_adocao(
  p_animal_id text, p_adotante_id text, p_data date, p_observacoes text default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  animal public.animais%rowtype;
  adotante public.adotantes%rowtype;
  adocao public.adocoes%rowtype;
begin
  -- RLS exige equipe ativa. Bloqueios impedem adoção/triagem concorrentes.
  select * into animal from public.animais where id::text = p_animal_id for update;
  if not found then raise exception 'Animal não encontrado.' using errcode = 'P0002'; end if;
  if animal.situacao <> 'disponivel' then
    raise exception 'O animal não está disponível.' using errcode = 'P0001';
  end if;
  if exists(select 1 from public.adocoes where animal_id = animal.id) then
    raise exception 'Este animal já possui adoção.' using errcode = 'P0001';
  end if;
  select * into adotante from public.adotantes where id::text = p_adotante_id for update;
  if not found then raise exception 'Adotante não encontrado.' using errcode = 'P0002'; end if;
  if adotante.status <> 'aprovado' then
    raise exception 'Aprove o cadastro antes de registrar a adoção.' using errcode = '22023';
  end if;
  insert into public.adocoes(animal_id,adotante_id,data_adocao,observacoes)
    values(animal.id,adotante.id,p_data,p_observacoes) returning * into adocao;
  update public.animais set situacao = 'adotado' where id = animal.id returning * into animal;
  return jsonb_build_object('adocao',to_jsonb(adocao),'animal',to_jsonb(animal));
end $$;
revoke all on function public.registrar_adocao(text,text,date,text) from public, anon;
grant execute on function public.registrar_adocao(text,text,date,text) to authenticated;
commit;
