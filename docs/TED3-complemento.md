# Documento Técnico do Projeto - Versão 3.0

Fonte das seções 20 a 31 do Documento Técnico do Projeto, versão 3.0 (TED 3 - back-end, persistência de dados e integração). O PDF é gerado por docs/gerar_documento_v3.py, que mantém integralmente as seções 1 a 19 da versão 2.0 e numera as seções abaixo a partir de 20. Revisão de 5 de novembro de 2026.

## 1 Finalidade e composição da versão 3.0

Esta versão registra a implementação da camada de back-end da solução, contemplando as regras de negócio, a persistência dos dados, a autenticação e a autorização, as validações, o tratamento de erros e a integração entre os componentes da aplicação. Conforme solicitado para esta etapa, o documento mantém integralmente o conteúdo das versões anteriores: as seções 1 a 19 reproduzem a versão 2.0, que já incorpora o diagnóstico, os requisitos e o planejamento da TED 1. As seções 20 a 31 foram acrescentadas nesta versão.

As seções anteriores descrevem o projeto no momento em que foram escritas. Quando houver diferença, prevalecem as informações das seções 20 a 31, que refletem o estado atual do repositório e da aplicação publicada.

## 2 Arquitetura implementada

A aplicação adota a arquitetura cliente-servidor planejada na TED 1, com front-end em HTML, CSS e JavaScript, back-end em Node.js com Express e persistência em PostgreSQL por meio do Supabase. O mesmo processo Express disponibiliza a API e as páginas da interface (index.html e as pastas pages, css, js e assets). Arquivos internos, como configurações e credenciais, não são publicados.

O navegador envia requisições HTTP com dados em JSON por meio do módulo js/api.js. Nas operações protegidas, a requisição inclui o token de acesso emitido pelo Supabase Auth. O arquivo src/app.js organiza as rotas e aplica cabeçalhos de segurança, controle de origens, limites de requisição, autenticação, autorização e validação das entradas. Os controladores coordenam cada caso de uso, os serviços encapsulam consultas e a integração com o Google Gemini, e o SDK do Supabase acessa o banco de dados, a autenticação e o armazenamento de imagens.

| Camada ou componente | Implementação e responsabilidade |
| --- | --- |
| Apresentação | index.html, pages, css e js: catálogo, formulários, área administrativa, área do adotante e mensagens ao usuário |
| Entrada HTTP | src/app.js: 34 operações da API e publicação seletiva dos arquivos da interface |
| Autorização | src/middlewares/authMiddleware.js: valida o token, o perfil ativo e o tipo de conta; cria um cliente do banco por requisição |
| Validação | src/schemas e validationMiddleware.js: tipos, campos obrigatórios, valores permitidos, limites e datas |
| Tratamento de erros | src/middlewares/errorHandler.js: respostas padronizadas sem expor detalhes internos do banco |
| Casos de uso | src/controllers: animais, histórico, adoções, interessados, conta do adotante, perfil, recuperação de senha e transparência |
| Serviços | src/services: assistente de adoção, ferramentas de busca, imagens e consultas de animais |
| Persistência | PostgreSQL: tabelas, chaves estrangeiras, restrições, índices, RLS, funções e gatilhos |
| Serviços externos | Supabase Auth e Storage; Google Gemini para o assistente e a busca inteligente |
| Hospedagem | Render, com publicação em https://anjos-de-patas.onrender.com |

As operações da equipe usam um cliente do banco associado ao token de cada requisição, de modo que as políticas de segurança em nível de linha (RLS) são aplicadas ao usuário correto. Alguns fluxos, como a manifestação pública de interesse e o acompanhamento, usam no servidor a chave administrativa do Supabase, sempre depois das validações e verificações de autorização. Essa chave nunca é enviada ao navegador.

## 3 Planejamento inicial e alterações justificadas

A TED 1 propôs uma aplicação web com front-end, back-end e banco de dados. Foram mantidos HTML, CSS e JavaScript na interface e PostgreSQL com Supabase na persistência. Node.js com Express concretizou a camada de back-end, já registrada na TED 2. A API permanece no mesmo repositório da interface e não foi separada em outro projeto. As alterações em relação ao planejamento inicial estão justificadas no quadro a seguir.

| Alteração | Justificativa |
| --- | --- |
| Autenticação separada dos perfis | Senhas e sessões ficam no Supabase Auth; a tabela de perfis guarda apenas nome, função e situação ativa, sem armazenar senhas |
| Interface publicada pelo próprio Express | Permite executar site e API com um único comando e simplifica a publicação |
| Conta do adotante | Permite que a pessoa interessada acompanhe o próprio pedido sem receber acesso administrativo |
| Acompanhamento do pedido por etapas | Registra a triagem, a entrevista e a aprovação, com controle de versão para evitar que uma edição sobrescreva outra |
| Adoção em função transacional | Substitui gravações separadas por uma única operação no banco; uma falha desfaz todas as alterações |
| Cliente do banco isolado por requisição | Evita o compartilhamento de sessão entre usuários e garante a aplicação correta das políticas de acesso |
| Validação de datas no servidor | Rejeita datas inexistentes e períodos invertidos antes da gravação |
| Retirada do blog do escopo | O blog não fazia parte dos requisitos da TED 1; foi removido para concentrar o esforço no fluxo de adoção |
| Hospedagem no Render | Disponibiliza a aplicação em endereço público para demonstração e testes |

As alterações não eliminam nenhum requisito da TED 1. O assistente com Gemini apoia a consulta aos animais, mas não aprova adoções; essa decisão continua com a equipe da ONG.

## 4 Modelagem e persistência dos dados

O script docs/database/01-schema.sql cria as tabelas base em um projeto Supabase vazio. As migrações em docs/migrations acrescentam a imagem do animal, o armazenamento de fotos, o interesse de adoção e o acompanhamento dos interessados, e o script docs/database/02-adocao-atomica.sql cria a função de registro da adoção. A ordem de execução e a criação da primeira conta da equipe estão descritas em docs/database/README.md. A estrutura foi instalada no Supabase utilizado pela aplicação publicada em 27/10/2026.

| Tabela | Principais atributos e relações |
| --- | --- |
| perfis | Identificador UUID ligado a auth.users; nome, função (admin, voluntario ou veterinario), situação ativa e datas |
| animais | Identificador numérico; nome, espécie, sexo, porte, faixa etária, temperamento, convivência, situação e imagem |
| adotantes | Identificador numérico; nome, e-mail único, telefone, endereço, situação, interesse, etapa e versão |
| adocoes | Chaves estrangeiras para animal e adotante; data e observações; no máximo uma adoção por animal |
| resgates | Chave estrangeira para animal; data, local, motivo e observações |
| registros_saude | Chave estrangeira para animal; data, descrição e observações |
| vacinas | Chave estrangeira para animal; vacina, data de aplicação e próxima dose |
| tratamentos | Chave estrangeira para animal; descrição, início, fim e situação |
| acompanhamento_eventos | Adotante, etapa, tipo do evento, nota, autor e data |

Um animal pode ter vários resgates, registros de saúde, vacinas e tratamentos, e no máximo uma adoção. Um adotante pode ter várias adoções e vários eventos de acompanhamento. O histórico do animal é mantido após a adoção, atendendo ao requisito RF16.

O banco aplica restrições para os valores de situação, espécie, sexo, porte e faixa etária, e índices para as consultas mais frequentes. O e-mail do adotante é único sem distinção entre maiúsculas e minúsculas. O acompanhamento usa um número de versão para impedir que duas pessoas da equipe sobrescrevam a mesma alteração. O registro da adoção bloqueia as linhas do animal e do adotante e é executado em uma transação.

## 5 Regras de negócio e funcionalidades

| Requisitos da TED 1 | Implementação |
| --- | --- |
| RF01 - login | Supabase Auth, verificação de perfil ativo e middleware de autorização |
| RF02 a RF05 - cadastro, edição, listagem e pesquisa | Controlador de animais, validação dos campos, filtros e consulta por nome |
| RF06 a RF10 - resgate, saúde, vacinas, tratamentos e histórico | Rotas por animal, tabelas específicas e consulta do histórico completo |
| RF11 a RF13 - situação e catálogo | Situações em tratamento, disponível e adotado; o catálogo público mostra apenas animais disponíveis |
| RF14 e RF15 - adoção e atualização da situação | Função registrar_adocao, com exigência de aprovação prévia, verificação de disponibilidade e transação única |
| RF16 - histórico após a adoção | As consultas administrativas mantêm todos os registros, sem exclusão automática |

No fluxo de interesse, a API confere se o animal continua disponível, exige autorização de contato e cadastra a pessoa interessada para triagem. Um e-mail já cadastrado retorna conflito, sem sobrescrever o registro existente. A equipe consulta os interessados, registra notas e contatos e avança as etapas do acompanhamento. A conclusão só é aceita quando existe uma adoção registrada.

No registro da adoção, apenas animal disponível e adotante aprovado são aceitos. A função bloqueia os registros, grava a adoção, altera a situação do animal e conclui o acompanhamento, tudo na mesma transação. Se ocorrer qualquer falha, o PostgreSQL desfaz todas as alterações.

A área do adotante localiza o pedido pelo e-mail da conta autenticada e devolve apenas as etapas, as datas e a adoção final, sem notas internas nem dados de outras pessoas. O envio de fotos aceita apenas JPEG, PNG ou WebP de até 5 MiB, e o conteúdo do arquivo é verificado além da extensão. O assistente de adoção recebe a mensagem do visitante, consulta os animais disponíveis por meio de uma ferramenta de busca e responde com sugestões e miniaturas.

## 6 Autenticação, autorização e proteção de dados

As contas são gerenciadas pelo Supabase Auth, e nenhuma senha é armazenada nas tabelas da aplicação. A área administrativa exige token válido e perfil da equipe existente e ativo. A área do adotante aceita apenas contas de adotante: uma conta de adotante não acessa as rotas da equipe, e o token da equipe é recusado na área do adotante. A recuperação de senha é feita por código enviado ao e-mail cadastrado.

A segurança em nível de linha (RLS) está ativa em todas as tabelas públicas. Visitantes não autenticados consultam apenas animais disponíveis. Contas autenticadas acessam os registros operacionais somente se a função private.equipe_ativa confirmar perfil da equipe ativo. Cada pessoa lê apenas o próprio perfil e pode alterar somente o próprio nome, sem conseguir mudar sua função ou reativar a própria conta.

A API usa Helmet para os cabeçalhos de segurança, CORS para restringir as origens do navegador e limitação de tentativas por endereço IP nas rotas de login, cadastro, recuperação de senha e interesse. O corpo das requisições é limitado a 1 MiB. As mensagens de erro não expõem detalhes internos do banco de dados.

## 7 Arquitetura de integração e endpoints

A comunicação entre navegador e API usa HTTP com dados em JSON, exceto no envio de imagens. A API valida as entradas, aplica a autorização e consulta o Supabase. Para o assistente e a busca inteligente, a API consome a API do Google Gemini, que interpreta a mensagem do visitante e utiliza uma ferramenta interna de busca para consultar apenas animais disponíveis no banco.

| Grupo | Principais operações |
| --- | --- |
| Autenticação | POST /api/login, /api/recuperar-senha, /api/redefinir-senha, /api/conta-adotante/cadastro e /api/conta-adotante/entrar |
| Conta e perfil | GET /api/conta-adotante; GET e PUT /api/perfil |
| Catálogo, interesse e transparência | GET /api/animais, /api/animais/:id e /api/resultados; POST /api/interesses |
| Inteligência artificial | POST /api/busca-inteligente e /api/agente |
| Gestão de animais | GET /api/admin/animais; POST /api/animais e /api/animais/imagem; PUT /api/animais/:id |
| Histórico | GET /api/resgates e /api/animais/:id/historico; POST de resgates, saúde, vacinas e tratamentos por animal |
| Adoções e adotantes | GET e POST /api/adocoes e /api/adotantes; PUT /api/adotantes/:id/status; GET /api/dashboard |
| Acompanhamento | GET /api/admin/interessados e o histórico de cada interessado; POST do acompanhamento |

A documentação técnica dos endpoints está no contrato OpenAPI 3.0 docs/openapi.json, que descreve as 34 operações, com parâmetros, corpos das requisições, esquema de segurança e respostas. O contrato foi conferido com as rotas definidas em src/app.js em 05/11/2026, sem divergências, e pode ser aberto no Swagger Editor ou importado no Postman e no Insomnia. O arquivo docs/API-v3.md complementa o contrato com exemplos e regras de cada grupo.

As respostas de erro seguem os códigos HTTP usuais: 400 para entrada inválida, 401 para sessão ausente ou inválida, 403 para acesso negado, 404 para registro inexistente, 409 para conflito, 413 para corpo excessivo, 429 para excesso de tentativas e 500 ou 503 para falhas internas ou de serviços externos.

## 8 Evidências de integração e resultados dos testes

A integração foi verificada em quatro níveis: testes automatizados da aplicação, testes dos scripts do banco em PostgreSQL descartável, homologação com os serviços reais do Supabase e verificações na aplicação publicada.

| Evidência | Resultado e alcance |
| --- | --- |
| Testes automatizados (npm test) | 99 testes aprovados, nenhuma falha, em 05/11/2026; abrangem validações, rotas, autorização, assistente, área do adotante, recuperação de senha e interface |
| Scripts do banco (npm run test:sql) | 9 grupos aprovados em 05/11/2026, executando os seis scripts oficiais em PostgreSQL descartável: RLS, acesso anônimo, conta sem perfil, autopromoção, adoção válida e inválida, rollback, conflito de versão e perfil inativo |
| Homologação com o Supabase real | 20 cenários aprovados em 27/10/2026 com Supabase Auth, PostgreSQL e Storage reais, do cadastro do animal à adoção, incluindo upload de imagem e persistência após reiniciar o servidor |
| Separação de acessos na aplicação publicada | 8 verificações aprovadas em 28/10/2026: cada tipo de conta acessa apenas a própria área |
| Aplicação publicada | Em 05/11/2026, páginas públicas, catálogo, perfil do animal, transparência e assistente com Gemini responderam corretamente; a área administrativa sem login foi bloqueada |

Na homologação de 27/10/2026, um animal fictício percorreu todo o fluxo: cadastro, registros de resgate, saúde, vacina e tratamento, envio de foto, publicação no catálogo, manifestação de interesse, aprovação pela equipe e adoção. O servidor foi então encerrado e reiniciado, e os dados foram consultados novamente no banco, confirmando a persistência. Os registros e contas temporárias foram removidos ao final. Os resultados detalhados estão em docs/evidencias/homologacao-real-20261027.

![Painel administrativo com indicadores lidos do banco após o registro de uma adoção](docs/evidencias/homologacao-real-20261027/painel-1440.png)

![Histórico do animal preservado após a adoção, com resgate, saúde, vacina, tratamento e adoção](docs/evidencias/homologacao-real-20261027/animais-1440.png)

![Acompanhamento da adoção na conta do adotante, sem as notas internas da equipe](docs/evidencias/homologacao-real-20261027/adotante-1440.png)

Ainda não foram realizados testes de carga, avaliação completa de acessibilidade e a validação do envio real de e-mails de confirmação e de recuperação de senha.

## 9 Dificuldades encontradas e soluções

| Dificuldade | Solução adotada |
| --- | --- |
| Ausência de um script inicial do banco versionado | Reconstrução das tabelas e políticas a partir do código, com teste automático de instalação do zero |
| Gravação da adoção em operações separadas | Função transacional com bloqueio dos registros e desfazimento automático em caso de falha |
| Cliente do banco compartilhado entre logins | Criação de um cliente isolado para cada login e requisição |
| Conta de adotante e conta da equipe acessando áreas indevidas | Verificação do tipo de conta em cada área e testes específicos |
| Datas aceitas como texto livre | Validação de formato, de datas existentes e da ordem dos períodos |
| Rotas novas sem documentação | Contrato OpenAPI com as 34 operações, conferido com o código |
| Bloqueio de subprocessos no ambiente de testes | Execução da mesma suíte sem isolamento de processos |
| Pausa do banco gratuito por inatividade | Restauração do projeto e rotina no GitHub Actions que consulta a aplicação a cada dois dias |

Permanecem como limitações: a renovação automática do token não foi implementada, uma conta pode registrar apenas um interesse por vez, os três perfis da equipe compartilham as mesmas permissões e não foi realizado teste de carga.

## 10 Instalação e execução

Use Node.js 22 ou superior e execute npm ci na raiz do projeto. Em um projeto Supabase vazio, execute os seis scripts do banco na ordem descrita em docs/database/README.md e crie a primeira conta da equipe. Copie o arquivo .env.example para .env e preencha SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY e GEMINI_API_KEY. O arquivo .env não deve ser publicado.

Execute npm start e acesse http://localhost:3000. Os testes são executados com npm test, e os scripts do banco podem ser verificados com npm run test:sql, após instalar a dependência indicada no README. A aplicação também está publicada em https://anjos-de-patas.onrender.com; por utilizar plano gratuito, o primeiro acesso após um período sem uso pode levar cerca de um minuto.

## 11 Histórico de versões atualizado

| Versão | Registro |
| --- | --- |
| 1.0 - agosto/2026 | Diagnóstico da demanda, apresentação da instituição, requisitos RF01 a RF16, requisitos não funcionais, arquitetura, tecnologias, cronograma e protótipos |
| 2.0 - outubro/2026 | Início da implementação, integração entre front-end, back-end e banco de dados, página pública, assistente de adoção, autenticação, dashboard, perfil e evidências da interface |
| 3.0 - novembro/2026 | Back-end completo: modelagem e scripts do banco, regras de negócio, adoção transacional, autenticação e autorização com RLS, conta do adotante, acompanhamento, contrato OpenAPI, testes automatizados, homologação real e publicação da aplicação |

## 12 Artefatos e referências da entrega

Repositório: https://github.com/Anjos-de-Patas/Anjos-de-Patas. Código-fonte: src (API), js, pages, css e assets (interface). Instalação: README.md e .env.example. Banco de dados: docs/database e docs/migrations. Endpoints: docs/openapi.json, docs/API-v3.md e API.md. Testes: test, scripts/validar-banco.mjs e docs/evidencias. Documento: docs/TED3-complemento.md, docs/gerar_documento_v3.py e output/pdf/Documento-Tecnico-Anjos-de-Patas-v3.pdf. Aplicação publicada: https://anjos-de-patas.onrender.com.

Referências técnicas consultadas: documentação do Express (https://expressjs.com/), do Node.js (https://nodejs.org/en/about), da segurança em nível de linha do Supabase (https://supabase.com/docs/guides/database/postgres/row-level-security), das funções de banco do Supabase (https://supabase.com/docs/guides/database/functions), da API Gemini (https://ai.google.dev/gemini-api/docs) e da especificação OpenAPI (https://spec.openapis.org/oas/v3.0.3). Acesso em: 5 nov. 2026.
