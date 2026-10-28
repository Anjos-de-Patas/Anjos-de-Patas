# Gestão dos interessados

O menu administrativo oferece a tela **Interessados** com pesquisa por nome, e-mail, telefone ou animal, filtro por etapa e paginação de vinte cadastros. A equipe pode registrar contatos, notas internas e consultar os cem eventos mais recentes.

Etapas: recebido, triagem, entrevista, aprovado, concluída e encerrado. A conclusão exige uma adoção registrada. O registro da adoção conclui o acompanhamento na mesma transação; uma conclusão não pode ser revertida pelo formulário de triagem.

## Preparação do ambiente

Aplicar os scripts nesta ordem, depois de revisar o esquema e as políticas do banco de destino:

1. `docs/migrations/20261009_interesse_adocao.sql`.
2. `docs/migrations/20261009_gestao_interessados.sql`.

O segundo script foi separado do script local que também incluía o blog. Não cria tabelas nem funções de artigos. Acrescenta `etapa`, `versao`, histórico de eventos e gatilhos. Os cadastros existentes recebem etapas compatíveis com os registros atuais; não são inventadas entrevistas anteriores. As mudanças são feitas em uma transação.

As novas rotas exigem sessão e perfil autorizado da equipe. A função de escrita só pode ser chamada pelo serviço do backend; a tabela de eventos usa RLS e não concede acesso direto a `anon` ou `authenticated`. As funções de gatilho precisam registrar histórico mesmo nas atualizações autenticadas já existentes, por isso executam com privilégios definidos e caminho de busca fixo. Não expor a chave de serviço ao navegador. As políticas das tabelas existentes continuam exigindo revisão no ambiente remoto.

## Edições simultâneas

O formulário envia a versão lida. A função bloqueia o cadastro durante a atualização e recusa versões antigas com conflito. A interface preserva a nota e pede atualização dos dados. A mudança de etapa e a anotação são gravadas juntas; uma falha desfaz ambas.

## Validação

Testes automatizados cobrem acesso sem sessão, pesquisa, paginação, limite de notas, histórico, autor validado no servidor, conflito e preservação da nota em falha. O script também foi executado em um PostgreSQL temporário com esquema e dados fictícios, verificando gatilhos, conclusão, versão, rollback e permissões. Isso não confirma o esquema ou as políticas do Supabase remoto. Nenhum script foi aplicado ao banco remoto nesta etapa.

Antes de disponibilizar, testar no ambiente de demonstração com duas sessões da equipe: pesquisar, registrar contato, consultar histórico, provocar conflito de edição e concluir através do registro de adoção. A área do adotante continua reservada para outro envio.
