# Perfil público e manifestação de interesse

O catálogo oferece um link para `pages/animal.html?id=ID`. A página consulta apenas animais disponíveis e exibe foto, características e um formulário de interesse com consentimento.

## Preparação do banco

Antes de habilitar o formulário, aplique o script existente `docs/migrations/20261009_interesse_adocao.sql` no ambiente de destino. Ele acrescenta a coluna JSONB `interesse` à tabela `public.adotantes` sem alterar os registros existentes. Este envio não executa SQL no banco remoto.

Confirme que a tabela de adotantes permanece protegida por RLS e sem políticas públicas de leitura de contatos. A rota de interesse grava pelo servidor com a chave de serviço; essa chave nunca deve estar no navegador. A política de leitura pública de animais deve permitir somente os campos/dados destinados ao catálogo. O banco remoto não foi auditado nesta etapa.

## Comportamento

- `GET /api/animais/:id`: retorna os campos públicos de um animal disponível, sem histórico clínico.
- `POST /api/interesses`: recebe animal_id, nome, e-mail, telefone, cidade, mensagem opcional e consentimento=true. Limita a cinco tentativas por IP a cada 15 minutos e confere novamente a disponibilidade antes de gravar.
- O cadastro entra como `em triagem`, guardando animal, cidade, mensagem e instante do consentimento em `interesse`. Um e-mail já cadastrado gera conflito; o formulário não sobrescreve cadastros existentes.
- A resposta de sucesso não devolve dados pessoais. O envio não reserva o animal, não aprova adoção e não envia e-mail ou WhatsApp automaticamente.
- O cadastro administrativo em `/api/adotantes` passa a exigir sessão da equipe. A tela existente envia o token. A equipe continua consultando os cadastros em Adoções; a interface detalhada de acompanhamento será uma etapa posterior.

Valide com dados fictícios: perfil disponível/indisponível, foto ausente, envio sem consentimento, e-mail duplicado, falha da API e pedido registrado. Confirme os canais oficiais de contato antes de disponibilizar o formulário ao público. Os testes usam clientes simulados e não validam persistência nem políticas do banco remoto.
