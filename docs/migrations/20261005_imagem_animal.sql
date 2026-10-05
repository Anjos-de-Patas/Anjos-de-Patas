-- Execute no SQL Editor do Supabase antes de usar o campo de imagem.
alter table public.animais add column if not exists imagem_url text;
