# Área do adotante

O botão Entrar do portal leva a `pages/entrar-adotante.html`, com acesso ao cadastro. O login da equipe permanece em `pages/login.html`, disponível no rodapé. A página de recuperação serve às duas áreas.

O cadastro cria uma conta no Supabase Auth, sem inserir perfil na tabela `perfis` e sem atribuir permissões administrativas. Antes de habilitar cadastros públicos, confira que eventuais gatilhos personalizados do projeto não concedem perfis da equipe automaticamente.

## Configuração antes de ativar

- Habilitar cadastro e login com e-mail/senha no Supabase Auth.
- Configurar Site URL, confirmação de e-mail e entrega de mensagens. O acesso exige e-mail confirmado.
- Aplicar os scripts de interesse e acompanhamento já enviados: `docs/migrations/20261009_interesse_adocao.sql` e `docs/migrations/20261009_gestao_interessados.sql`.
- Conferir as políticas e a separação de permissões no projeto remoto.

Não há novo script SQL nesta etapa. Nenhuma configuração ou cadastro foi feito no Supabase remoto, ao qual a conexão atual não tem acesso.

## Consulta e privacidade

A consulta usa o e-mail confirmado retornado por `auth.getUser(token)`, nunca parâmetros enviados pelo navegador. Retorna somente a etapa, o histórico de etapas e, quando concluída, o animal e a data da adoção efetivamente registrada. Não retorna notas, contatos internos ou identificadores da equipe.

Criar conta não registra interesse. O e-mail confirmado deve ser o mesmo informado no formulário público. Atualmente existe um cadastro de interessado por e-mail; múltiplos pedidos por conta não estão contemplados.

O token do adotante fica em `sessionStorage`, separado do token administrativo. Ao sair, a aplicação limpa o token local; isso não revoga um token copiado anteriormente no servidor. A sessão não é renovada automaticamente: após expirar, é necessário entrar novamente. Senhas e dados de contato não são gravados no armazenamento do navegador pela aplicação.

## Validação

Os testes usam Auth e consultas simuladas, cobrindo consentimento, senha, confirmação de e-mail, acesso sem token, isolamento de duas contas, remoção de notas privadas da resposta, ausência de pedido, histórico real e adoção concluída. Ainda é necessário testar confirmação de e-mail, cadastro, login e persistência no ambiente de demonstração com duas contas diferentes.
