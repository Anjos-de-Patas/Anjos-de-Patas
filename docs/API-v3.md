# API - complemento da versão 3.0

Contrato importável: [openapi.json](openapi.json). Os schemas de entrada são gerados dos validadores Zod; refinamentos como datas existentes, ordem dos períodos e exigência de versão ao editar são descritos aqui. As respostas de sucesso no OpenAPI são envelopes genéricos; os campos principais aparecem abaixo e em `../API.md`. Os status de erro listados no contrato são possibilidades comuns; cada controlador trata seu próprio subconjunto.

## Autenticação e acesso

Use `Authorization: Bearer <token>`. ONG significa conta autenticada com registro ativo em `perfis` e perfil `admin`, `voluntario` ou `veterinario`. Os três perfis atualmente compartilham as permissões das rotas operacionais. Conta de adotante exige token válido e e-mail confirmado; não concede acesso de equipe. O front-end mantém os tokens em chaves separadas no `sessionStorage` e envia as requisições por `js/api.js`.

| Método e rota | Acesso | Entrada e retorno principal |
| --- | --- | --- |
| GET `/health` | Público | `{sucesso:true,status:"ativo"}`; não testa banco |
| POST `/api/login` | Público | email, password; retorna token e usuario |
| POST `/api/recuperar-senha` | Público | email; retorna mensagem genérica |
| POST `/api/redefinir-senha` | Público | email, codigo de 6 a 10 dígitos, password de 8 a 128 caracteres; retorna mensagem |
| POST `/api/conta-adotante/cadastro` | Público | nome, email, password, consentimento=true; 201 e mensagem |
| POST `/api/conta-adotante/entrar` | Público | email, password; retorna token |
| GET `/api/conta-adotante` | Adotante | retorna conta e interesse, ou interesse=null |
| GET `/api/perfil` | ONG | retorna usuario |
| PUT `/api/perfil` | ONG | nome de 2 a 100 caracteres; retorna usuario e mensagem |

O login não oferece renovação de token na API: ao expirar, entre novamente. Sair da interface remove o token local. A recuperação solicita encerramento global das sessões pelo Auth; tokens de acesso já emitidos podem permanecer válidos até expirar. O back-end revalida usuário e perfil ativo nas operações de equipe.

## Catálogo, interesses e IA

| Método e rota | Acesso | Entrada e retorno principal |
| --- | --- | --- |
| GET `/api/animais` | Público | filtros nome, especie, sexo, porte, faixa_etaria; retorna animais |
| GET `/api/animais/:id` | Público | ID numérico/UUID; retorna animal disponível |
| GET `/api/resultados` | Público | retorna dados com três contagens e atualizado_em |
| POST `/api/interesses` | Público | animal_id textual, nome, email, telefone, cidade, mensagem opcional, consentimento=true; 201 `{sucesso:true}` |
| POST `/api/busca-inteligente` | Público | texto de 2 a 500 caracteres; retorna mensagem, criterios_identificados, total_encontrado, resultados |
| POST `/api/agente` | Público | mensagem de 2 a 1000 caracteres, conversa_id opcional; retorna conversa_id e resultado do agente |

Espécie: `cao`/`gato`; sexo: `macho`/`femea`; porte: `pequeno`/`medio`/`grande`; idade: `filhote`/`adulto`/`idoso`. O cliente público do banco só acessa animais disponíveis com o RLS do schema entregue. A preferência não reserva o animal e não aprova adoção. E-mail duplicado resulta em 409 na manifestação; a aplicação não altera um pedido anterior por essa rota. Os dados pessoais não são devolvidos na resposta pública.

## Gestão de animais e adoções

| Método e rota | Acesso | Entrada e retorno principal |
| --- | --- | --- |
| GET `/api/admin/animais` | ONG | mesmos filtros do catálogo e situacao; retorna animais |
| POST `/api/animais` | ONG | animalSchema no OpenAPI; 201 e animal |
| PUT `/api/animais/:id` | ONG | campos parciais de animalSchema; retorna animal |
| POST `/api/animais/imagem` | ONG | corpo binário JPEG/PNG/WebP até 5 MiB; 201 e imagem_url |
| GET `/api/resgates` | ONG | retorna resgates |
| GET `/api/animais/:id/historico` | ONG | retorna animal e historico com resgates, registros_saude, vacinas, tratamentos e adocoes |
| POST `/api/animais/:id/resgates` | ONG | data_resgate, local_resgate, motivo, observacoes opcional; 201 e registro |
| POST `/api/animais/:id/saude` | ONG | data_registro, descricao, observacoes opcional; 201 e registro |
| POST `/api/animais/:id/vacinas` | ONG | nome, data_aplicacao, proxima_dose e observacoes opcionais; 201 e registro |
| POST `/api/animais/:id/tratamentos` | ONG | descricao, inicio, fim opcional, status=ativo/concluido/cancelado, observacoes opcional; 201 e registro |
| GET `/api/adotantes` | ONG | retorna adotantes |
| POST `/api/adotantes` | ONG | nome, email, telefone, endereco opcional; 201 e adotante em triagem |
| PUT `/api/adotantes/:id/status` | ONG | status=em triagem/aprovado/reprovado; retorna adotante |
| GET `/api/adocoes` | ONG | retorna adocoes |
| POST `/api/adocoes` | ONG | animal_id, adotante_id, data_adocao, observacoes opcional; 201, adocao e animal |
| GET `/api/dashboard` | ONG | retorna dados com indicadores internos |

Datas usam `AAAA-MM-DD` e devem existir no calendário. Próxima dose não pode anteceder aplicação; fim não pode anteceder início. Campos opcionais de data vazios são gravados como NULL. `POST /api/adocoes` exige animal `disponivel` e adotante `aprovado`; a função `registrar_adocao` grava adoção, altera o animal e conclui acompanhamento em uma transação. É necessário instalar `database/02-adocao-atomica.sql`. Erros: 404 para registro ausente, 409 para indisponibilidade/duplicidade, 400 para adotante não aprovado e 403 para falta de permissão. Nenhum erro SQL bruto é devolvido por esse endpoint.

Exemplo de adoção, depois de criar animal e aprovar adotante:

```http
POST /api/adocoes
Authorization: Bearer <token-da-equipe>
Content-Type: application/json

{"animal_id":1,"adotante_id":2,"data_adocao":"2026-10-26"}
```

Resposta 201 (identificadores ilustrativos):

```json
{"sucesso":true,"adocao":{"id":7,"animal_id":1,"adotante_id":2,"data_adocao":"2026-10-26"},"animal":{"id":1,"situacao":"adotado"}}
```

Os registros reais também incluem as demais colunas retornadas pelo banco.

## Acompanhamento

| Método e rota | Acesso | Entrada e retorno principal |
| --- | --- | --- |
| GET `/api/admin/interessados` | ONG | pagina, busca, etapa; interessados, total e pagina (20 por página) |
| GET `/api/admin/interessados/:id/historico` | ONG | retorna eventos internos, até 100 |
| POST `/api/admin/interessados/:id/acompanhamento` | ONG | versao obrigatória; etapa opcional; tipo=nota/contato; nota até 3000 caracteres; retorna sucesso |

Etapas: `recebido`, `triagem`, `entrevista`, `aprovado`, `concluida`, `encerrado`. Conclusão exige adoção gravada. Em conflito de versão, recarregue o cadastro; a alteração antiga não sobrescreve a nova. A área do adotante retorna apenas etapas, datas e adoção final, sem notas internas.

## Erros e limites

Entradas inválidas geralmente retornam 400, token ausente/inválido 401, perfil sem autorização 403, ausente 404, conflito 409, excesso de tamanho 413, limite de requisições 429 e falha interna/serviço 500/503. O envelope contém `erro` e, na maioria das rotas, `sucesso:false`; validações podem trazer detalhes. Há controladores legados que ainda retornam `error.message` do banco. A padronização completa de erros é uma melhoria pendente, registrada na TED 3.

Login, cadastro e recuperação compartilham um limitador de 10 requisições por IP em 15 minutos. Busca/agente compartilham limite de 20. Interesses têm limite de cinco. Corpo JSON: 1 MiB; imagem: 5 MiB. Limites são mantidos na memória de cada processo.
