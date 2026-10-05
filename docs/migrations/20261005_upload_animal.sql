-- Execute no SQL Editor do Supabase. As fotos serão visíveis no catálogo público.
alter table public.animais add column if not exists imagem_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('animais-imagens', 'animais-imagens', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
-- Uploads passam pela API autenticada da ONG, usando a chave apenas no servidor.
