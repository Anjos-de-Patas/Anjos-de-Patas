# Banco de dados

O banco usa PostgreSQL no Supabase, com Supabase Auth para as contas e Supabase Storage para as fotos dos animais. Os scripts abaixo criam a estrutura do zero, sem usuários, senhas ou contatos reais.

## Instalação em um projeto Supabase vazio

No SQL Editor do Supabase, execute cada arquivo inteiro, nesta ordem:

1. `docs/database/01-schema.sql`: tabelas base, chaves, índices, permissões e RLS.
2. `docs/migrations/20261005_imagem_animal.sql`: coluna da imagem do animal.
3. `docs/migrations/20261005_upload_animal.sql`: bucket público de imagens.
4. `docs/migrations/20261009_interesse_adocao.sql`: preferência e consentimento de contato.
5. `docs/migrations/20261009_gestao_interessados.sql`: etapas do acompanhamento, auditoria e função `registrar_acompanhamento`.
6. `docs/database/02-adocao-atomica.sql`: função transacional `registrar_adocao`, exigida pelo back-end.

O primeiro script serve só para instalação nova e falha se as tabelas já existirem. Em um banco já em uso, faça backup, compare com `01-schema.sql` e aplique apenas os scripts que faltam. **Não execute o schema base sobre um banco existente.**

## Primeira conta da equipe

Crie a conta no painel do Supabase Auth e copie o UUID. Depois, no SQL Editor:

```sql
insert into public.perfis(id, nome, perfil, ativo)
values ('00000000-0000-0000-0000-000000000001', 'Nome da pessoa', 'admin', true);
```

Troque o UUID de exemplo pelo UUID real. Os outros perfis aceitos são `voluntario` e `veterinario`. Contas de adotante são criadas pela própria aplicação e não recebem perfil da equipe.

## Modelo de dados

| Tabela | Chave e relações | Conteúdo |
| --- | --- | --- |
| `perfis` | UUID, FK para `auth.users.id` | nome, perfil, ativo, datas |
| `animais` | bigint identity | nome, espécie, sexo, porte, idade, convivência, situação, imagem |
| `adotantes` | bigint identity; e-mail único | contato, endereço, status, interesse, etapa, versão |
| `adocoes` | bigint identity; FKs para animal e adotante | data e observações; uma adoção por animal |
| `resgates` | bigint identity; FK para animal | data, local, motivo e observações |
| `registros_saude` | bigint identity; FK para animal | data, descrição e observações |
| `vacinas` | bigint identity; FK para animal | vacina, aplicação e próxima dose |
| `tratamentos` | bigint identity; FK para animal | descrição, período e status |
| `acompanhamento_eventos` | bigint identity; adotante indexado | etapa, tipo, nota, autor e data |

Um animal tem vários registros de histórico e no máximo uma adoção. Um adotante pode ter várias adoções. O interesse por um animal é uma preferência, não uma reserva.

## Autorização (RLS)

RLS está ativa em todas as tabelas públicas. Visitantes (`anon`) veem apenas animais disponíveis. Contas autenticadas precisam de perfil ativo da equipe para acessar os registros operacionais, e cada pessoa só lê e altera o próprio perfil, sem poder mudar a própria função. A função `registrar_adocao` usa as permissões do usuário autenticado; `registrar_acompanhamento` é restrita ao `service_role`, usado pela API depois de verificar a autorização.

## Verificação automática dos scripts

O script `scripts/validar-banco.mjs` cria um PostgreSQL descartável em memória (PGlite), simula os papéis do Supabase, executa todos os scripts na ordem acima e verifica 9 grupos de regras: RLS, acesso anônimo, conta sem perfil, autopromoção, adoção válida e inválida, rollback, conflito de versão e perfil inativo. Ele não lê o `.env` nem acessa o Supabase.

```powershell
npm install --no-save --package-lock=false @electric-sql/pglite@0.5.8
npm run test:sql
```

Resultado em 05/11/2026: 9 grupos aprovados.

## Referências

- [RLS no Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Funções PostgreSQL no Supabase](https://supabase.com/docs/guides/database/functions)
