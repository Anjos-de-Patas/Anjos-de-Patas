# Registro transacional de adoção

O backend passa a chamar `registrar_adocao` com o cliente autenticado da equipe. A função bloqueia o animal e o adotante durante a operação, exige animal disponível e cadastro aprovado, registra a adoção e altera a situação do animal na mesma transação. O gatilho de acompanhamento já enviado conclui o processo. Uma falha desfaz todas essas alterações.

O contrato da interface permanece `{ sucesso, adocao, animal }`. A API traduz conflitos, falta de aprovação, registros ausentes e falta de permissão sem devolver detalhes internos do banco.

## Preparação antes de ativar

Revisar o esquema, as relações e as políticas de acesso do banco de destino. Depois dos scripts de interesse e acompanhamento, aplicar `docs/database/02-adocao-atomica.sql` antes de publicar este backend. Sem a função, o registro de adoções retorna erro e não deve ser disponibilizado.

A função usa `SECURITY INVOKER`, caminho de busca vazio e nomes de tabelas qualificados. Executa com as permissões do usuário autenticado; as políticas RLS existentes devem restringir leitura e escrita à equipe ativa. A permissão de chamada é revogada de `PUBLIC` e `anon` e concedida a `authenticated`. Isso exige conferir as políticas existentes: conceder a chamada não é suficiente para autorizar adotantes a registrar adoções.

O script não cria as tabelas base nem substitui suas políticas. Nenhuma alteração foi aplicada ao Supabase remoto, ao qual a conexão atual não tem acesso.

## Outros ajustes desta etapa

- Cada login administrativo cria um cliente próprio, sem modificar a sessão do cliente público do catálogo.
- O middleware consulta o perfil com o cliente autenticado e mantém o bloqueio de usuários sem perfil ou inativos.
- Cadastro administrativo de interessados e consulta/edição do perfil usam o cliente autenticado da requisição.
- Datas clínicas e de adoção rejeitam dias inexistentes; próxima vacina e fim de tratamento não podem anteceder o início. Campos opcionais vazios são enviados ao banco como `null`. A validação de datas futuras de resgate permanece ativa.

## Validação

Testes automatizados cobrem a chamada transacional, respostas de erro, isolamento dos logins, usuário inativo, cliente autenticado e datas. Em PostgreSQL temporário com esquema e dados fictícios, foram verificados acesso anônimo e sem perfil, cadastro sem aprovação, animal indisponível, duplicidade, conclusão do acompanhamento e rollback após falha simulada na atualização do animal. Duas sessões concorrentes resultaram em uma única adoção.

Essa validação não confirma compatibilidade com o Supabase remoto. Antes da publicação, aplicar o script revisado no ambiente de demonstração e repetir o fluxo com uma conta da equipe, verificando também a consulta posterior pelo adotante.
