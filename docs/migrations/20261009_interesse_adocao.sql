-- Execute no SQL Editor do projeto Supabase antes de habilitar o formulário público.
-- Guarda a preferência junto ao cadastro já utilizado na triagem administrativa.
alter table public.adotantes add column if not exists interesse jsonb;
comment on column public.adotantes.interesse is
  'Preferência informada no portal: animal_id, animal_nome, cidade, mensagem e consentimento_em. Acesso restrito à equipe.';
