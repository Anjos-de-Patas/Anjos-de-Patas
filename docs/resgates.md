# Tela de resgates

O menu administrativo Resgates leva a `pages/resgates.html`. A equipe consulta os registros, pesquisa por animal, local ou motivo e registra data, local, motivo e observações opcionais para um animal já cadastrado. O registro também aparece no histórico do animal.

A página usa `GET /api/admin/animais`, `GET /api/resgates` e `POST /api/animais/:id/resgates`. As rotas exigem sessão e perfil autorizado da equipe. A consulta e a escrita usam o cliente autenticado do usuário, respeitando as políticas do banco.

Não há migração SQL nova: a tabela `resgates` e a rota de registro já existiam. A listagem mostra os registros retornados pela API e a pesquisa ocorre no navegador; não há paginação própria nesta etapa.

Datas inexistentes ou posteriores ao dia atual são recusadas pelo servidor. A interface também limita datas futuras, bloqueia o envio enquanto carrega e preserva os campos quando o registro falha. Sem consulta dos animais, não é permitido registrar; o botão Atualizar dados permite tentar novamente.

Os testes usam dados e clientes simulados. Antes de disponibilizar, conferir as políticas da tabela `resgates` e validar a persistência com uma conta da equipe no Supabase de destino. Nenhuma alteração ou registro foi feito no banco remoto nesta etapa.
