# ANJOS DE PATAS: VERSÃO PARCIAL DO PRODUTO MÍNIMO VIÁVEL

Revisão de 27 de outubro de 2026. Documento independente atualizado para a entrega da TED 3. Os documentos anteriores são preservados como histórico; este relatório registra o estado da branch `fix/consulta-animal-por-nome`, commit `be388a6`.

## 1 INTRODUÇÃO

O projeto Anjos de Patas desenvolve uma aplicação web para apoiar a centralização das informações de animais atendidos pela Sociedade Protetora dos Animais Anjos de Patas, em Balsas, Maranhão. A TED 1 identificou registros dispersos e dificuldades na consulta do histórico e da situação de adoção dos animais (Equipe Anjos de Patas, 2026a).

Esta entrega apresenta uma versão parcial do Produto Mínimo Viável (MVP). O recorte implementado permite cadastrar um animal, registrar seu histórico, disponibilizá-lo no catálogo, receber um interesse, avaliar o cadastro e registrar a adoção, preservando o histórico. Trata-se de um fluxo operacional verificável, acompanhado de testes, e não apenas de um conjunto de telas.

O objetivo desta revisão é demonstrar a evolução técnica em relação ao planejamento e reunir arquitetura, funcionalidades, evidências, testes, dificuldades, atividades restantes e referências. A avaliação do atendimento é técnica; a atribuição da nota e a aceitação do formato cabem à instituição e ao professor.

## 2 IDENTIFICAÇÃO DA EQUIPE E DA ENTREGA

Instituição: UNIBALSAS - Centro Universitário de Balsas. Curso: Análise e Desenvolvimento de Sistemas. Disciplina: Programação para Web. Professor: Marcos David Souza Ramos. Local e ano: Balsas, MA, 2026.

Equipe: Carinne da Silva Borges; João Pedro Strasser Santos; Júlio César Lima dos Reis; Rogério Mota de Melo. A identificação foi conferida com os documentos do projeto. Não são atribuídas como definitivas funções individuais que apresentam divergências nas versões anteriores.

Repositório oficial: https://github.com/Anjos-de-Patas/Anjos-de-Patas . Código da etapa: branch fix/consulta-animal-por-nome, commit be388a61949a3bddf616d7e698686b819a7fb0db. Pull request: https://github.com/Anjos-de-Patas/Anjos-de-Patas/pull/1 . As atualizações ainda não foram integradas à main.

A demonstração validada utiliza a API e a interface em servidor local e os serviços remotos reais do Supabase. Não há URL pública de aplicação verificada nesta revisão. O endereço localhost exige execução na máquina do avaliador e não é um serviço público hospedado.

## 3 ARQUITETURA E TECNOLOGIAS

A arquitetura é cliente-servidor. HTML, CSS e JavaScript compõem a interface. A API utiliza Node.js e Express para executar os casos de uso, organizar rotas e aplicar middlewares (OpenJS Foundation, [s.d.]; Express, [s.d.]).

Fluxo principal: navegador → API Express → Supabase Auth, PostgreSQL e Storage. O Gemini auxilia consultas; a equipe mantém a responsabilidade de aprovar a adoção.

| Camada | Implementação | Responsabilidade |
| --- | --- | --- |
| Interface | HTML, CSS e JavaScript | Catálogo, formulários, painel e acompanhamento |
| API | Node.js e Express 4.21 | Rotas HTTP e coordenação dos casos de uso |
| Validação | Zod 3.25 | Campos, enumerações, limites e datas |
| Segurança HTTP | Helmet, CORS e rate limit | Cabeçalhos, origens e limitação de envios |
| Autenticação | Supabase Auth | Usuários, sessões e confirmação de conta |
| Persistência | PostgreSQL no Supabase | Tabelas, relações, regras e transações |
| Imagens | Supabase Storage | Upload e leitura das fotos do catálogo |
| IA auxiliar | SDK Google GenAI | Busca inteligente e assistente, não homologados nesta execução |

As versões são as declaradas no projeto. O código usa Express 4, sem migração para Express 5. Chaves de serviço permanecem no servidor.

A autorização exige sessão e perfil ativo. Políticas Row Level Security (RLS) restringem os registros, em conjunto com permissões de tabela (Supabase, [s.d.]). A função de adoção bloqueia animal e adotante e grava as mudanças em uma transação.

## 4 FUNCIONALIDADES E ADERÊNCIA À TED 1

A matriz relaciona os requisitos funcionais da TED 1 ao código e à validação disponível. A evidência se refere à versão parcial da etapa; não representa cobertura exaustiva de todas as entradas, combinações ou condições operacionais.

| Requisitos | Funcionalidade implementada | Evidência disponível |
| --- | --- | --- |
| RF01 | Login dos usuários autorizados | Login real, conta sem perfil e perfil inativo verificados |
| RF02 a RF05 | Cadastro, edição, listagem e pesquisa | Cadastro e atualização reais; testes automatizados de filtros e formulários |
| RF06 | Registro de resgate | Gravação e consulta reais por animal |
| RF07 a RF09 | Saúde, vacinas e tratamentos | Três registros gravados e recuperados no Supabase |
| RF10 | Histórico individual | Consulta após adoção, preservando os eventos |
| RF11 a RF13 | Situação e catálogo de adoção | Animal em tratamento e adotado indisponíveis no perfil público |
| RF14 e RF15 | Registro da adoção e mudança de situação | Transação real, aprovação prévia e rejeição de duplicidade |
| RF16 | Histórico mantido após adoção | Resgate, saúde, vacina, tratamento e adoção recuperados |

Também foram implementados cadastro de interesse, acompanhamento por etapas, conta do adotante, recuperação de senha por código, upload de imagem, perguntas frequentes e transparência com indicadores agregados. Blog e histórias de adoção foram retirados do escopo da interface desta branch. O schema remoto conserva uma tabela e artigos legados de blog; sua existência não representa uma funcionalidade entregue nesta etapa.

Os requisitos não funcionais possuem evidência parcial: há autenticação e autorização, validação de entradas, mensagens de erro/sucesso e testes em diferentes larguras de tela. A persistência do fluxo foi comprovada remotamente. Usabilidade ampla, acessibilidade completa, desempenho sob carga e resistência a ataques ainda exigem avaliação própria.

## 5 EVOLUÇÃO TÉCNICA E ESCOPO

A TED 1 reuniu diagnóstico, requisitos e planejamento. A TED 2 consolidou as primeiras telas e integrações. Nesta etapa, a solução evoluiu para persistência estruturada, acesso autenticado por requisição, regras transacionais de adoção e acompanhamento do interessado (Equipe Anjos de Patas, 2026a, 2026b).

O PR reúne onze commits incrementais após a base: consulta por nome, recuperação de senha, perfil público e interesse, identidade visual, gestão de interessados, conta do adotante, ajuste do assistente, resgates, adoção transacional/autenticação, perguntas frequentes e transparência. O histórico anterior foi preservado (Equipe Anjos de Patas, 2026c).

Em 27/10/2026 a estrutura foi instalada no novo Supabase, com dez tabelas públicas protegidas por RLS, funções e armazenamento de imagens. Foram removidas permissões públicas desnecessárias da função automática de ativação de RLS. A branch publicada utiliza as funcionalidades operacionais e mantém blog fora das rotas e telas.

A homologação desta revisão acrescenta comprovação real de Auth, banco e Storage. A aprovação no teste não significa que todos os fluxos estejam prontos para operação da ONG. As contas de teste foram confirmadas pela administração, sem envio de e-mail, e removidas ao final. A conta administrativa definitiva e a publicação pública continuam pendentes.

## 6 METODOLOGIA E RESULTADOS DOS TESTES

A avaliação combinou três níveis: testes automatizados com dependências simuladas, verificações SQL históricas em banco descartável e homologação atual contra os serviços remotos reais. Os resultados desses níveis são apresentados separadamente para evitar confundir simulação com persistência real.

| Nível | Resultado | Alcance e limite |
| --- | --- | --- |
| Suíte atual da branch | 69 testes aprovados, zero falhas | Validações, rotas, autorização e comportamento de interface; não são 69 testes remotos |
| SQL local anterior | Nove grupos registrados em 26/10 | Evidência histórica em PostgreSQL descartável; não reexecutada nesta revisão |
| Homologação remota atual | Resultado detalhado no quadro seguinte | API local com Auth, PostgreSQL e Storage reais |
| Conferência visual | Capturas em desktop e celular | Demonstra telas específicas; não é auditoria completa de acessibilidade |

O comando da suíte é node --test --test-isolation=none test/*.test.js, executado na cópia da branch. O modo sem isolamento contorna a restrição de criação de subprocessos observada no ambiente de desenvolvimento. A saída da suíte acompanha o conjunto de evidências no arquivo testes-automatizados-69.txt.

Na homologação remota, foram criadas três contas temporárias: equipe, adotante e outra pessoa adotante. Todas usaram endereços reservados em example.com e senha aleatória não registrada. Nome, telefone, animal e informações clínicas foram fictícios. A criação administrativa de contas já confirmadas não testa a entrega nem a confirmação por e-mail.

Foram enviados pedidos HTTP à API real para cadastro e edição do animal, históricos, upload, interesse, aprovação e adoção. Depois, o servidor HTTP foi encerrado e reaberto no mesmo processo Node, e os dados foram consultados novamente no banco remoto. Isso verifica que os registros não dependiam de um estado mantido apenas na interface, sem equivaler a um teste de reinicialização do sistema operacional.

Os resultados individuais e as respostas HTTP sem credenciais estão no arquivo resultado.json do conjunto homologacao-real-20261027. A limpeza excluiu somente os IDs criados pelo ensaio e verificou o retorno das contagens operacionais aos valores iniciais. As sequências de identificadores podem avançar com a realização do teste.

## 7 EVIDÊNCIAS DO FUNCIONAMENTO

As figuras desta seção foram capturadas da interface real servida pelo Express local, consultando o Supabase remoto durante o teste. Os dados são fictícios e já foram removidos. A imagem usada no teste de upload foi a marca do próprio projeto, não uma fotografia de animal real. As telas representam o momento da homologação e não os números atuais da ONG.

As operações foram conduzidas por requisições HTTP automatizadas; as capturas mostram a consulta dos resultados pela interface. Não se afirma que todos os cadastros tenham sido preenchidos manualmente no navegador. O relatório JSON preserva o registro verificável das operações.

<!-- EVIDENCIAS_REAIS -->

## 8 DIFICULDADES ENCONTRADAS E SOLUÇÕES

| Dificuldade | Solução adotada | Limite atual |
| --- | --- | --- |
| Banco novo sem tabelas | Instalação ordenada do schema e incrementos | Rotina de backup operacional ainda a definir |
| Gravações separadas de adoção | Função transacional com bloqueio e rollback | Sem ensaio de carga nesta revisão |
| Compartilhamento de cliente de sessão | Cliente de autenticação isolado por login/requisição | Renovação de token ainda a revisar |
| Alterações simultâneas no acompanhamento | Versão do registro e resposta de conflito | Testes unitários e SQL local prévios |
| Restrição de rede no Git do terminal | Uso do conector GitHub e conferência do commit | Publicação da aplicação ainda pendente |
| Divergência entre PDF e código | Relatório independente atualizado com resultados reais | Documentos antigos mantidos como histórico |
| Ausência de configuração completa de e-mail e IA | Limites registrados sem apresentar sucesso simulado | Validar entrega de mensagens e Gemini antes de demonstrá-los |

A recuperação de senha por código está implementada e possui testes com Auth simulado. A validação com caixa de e-mail real ainda não foi concluída. O assistente possui integração com Gemini no código, mas a chave não estava disponível na execução atual; a IA não foi chamada neste ensaio. Nenhum resultado real dessas duas integrações é presumido.

## 9 PLANEJAMENTO DAS ATIVIDADES RESTANTES

O cronograma é uma proposta para organização da conclusão. D representa o primeiro dia de trabalho após esta revisão, e os prazos dependem da disponibilidade da equipe e dos acessos. Os responsáveis definitivos devem ser confirmados pela equipe; a coluna indica a frente de trabalho, sem inventar acordos individuais.

| Atividade | Prazo proposto | Responsável proposto | Critério de conclusão |
| --- | --- | --- | --- |
| Criar acesso definitivo da equipe | D+1 | Frente de back-end e ONG | Login administrativo sem conta de teste |
| Configurar e testar e-mails | D+1 a D+2 | Frente de back-end | Confirmação e recuperação recebidas; código inválido e expirado rejeitados |
| Homologar Gemini | D+2 | Frente de integração IA | Consultas reais documentadas e falhas tratadas |
| Preparar e executar publicação | D+2 a D+3 | Frente de infraestrutura | URL pública acessível, sem exposição de segredos |
| Repetir fluxo após publicação | D+3 | Frente de testes | Cadastro até adoção e leitura do histórico no ambiente publicado |
| Revisar acessibilidade e navegação | D+3 a D+4 | Frente de interface | Menu, teclado, legibilidade e telas principais verificados |
| Conferir e entregar os artefatos | D+4 | Toda a equipe | PDF, evidências, links e PR revisados pelo grupo |

A conta administrativa temporária da homologação foi excluída e não serve como acesso permanente. O endereço público não deve ser anunciado antes da implantação e do teste. Canais oficiais de contato e documentos institucionais dependem de fornecimento e autorização da ONG.

## 10 EXECUÇÃO, REPOSITÓRIO E DEMONSTRAÇÃO

Para reproduzir a versão avaliada, obtenha o repositório oficial e selecione a branch fix/consulta-animal-por-nome. A referência exata do código é o commit be388a6. A main ainda não reúne estas alterações; por isso, o link da branch deve acompanhar a entrega.

Instale as dependências com npm ci, configure as variáveis da aplicação em .env sem publicar o arquivo e execute npm start. A interface local usa http://localhost:3000 e a API responde em /health. A resposta de saúde confirma o processo HTTP; a conectividade do banco deve ser verificada por uma operação da aplicação.

As variáveis necessárias são SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY, FRONTEND_URL e PORT. GEMINI_API_KEY é necessária para as funcionalidades de IA. Não há senha administrativa padrão. O ambiente Supabase deve possuir a estrutura, as funções e as políticas documentadas. Não se deve executar novamente o schema base em um banco já instalado.

A demonstração recomendada ao avaliador é: entrar como equipe, cadastrar animal, registrar histórico, disponibilizar o animal, manifestar interesse, aprovar o cadastro, registrar a adoção e consultar o acompanhamento. A URL localhost é local; para acesso externo, deve-se entregar o endereço de hospedagem após a implantação ou combinar uma demonstração executada pela equipe.

Os artefatos desta revisão são o PDF atualizado, o relatório editável, os resultados da homologação, as sete capturas e o código publicado na branch. Não foram incluídas chaves, senhas ou tokens nesses materiais. O script de homologação utiliza dados fictícios e remove apenas os registros que cria; sua reexecução exige revisão e acesso autorizado ao projeto.

## 11 CONSIDERAÇÕES FINAIS

A solução atende tecnicamente ao conceito de MVP parcial definido para esta etapa: há um fluxo principal implementado, dados persistidos, controle de acesso, evidências e testes que demonstram evolução além do protótipo visual. Os requisitos RF01 a RF16 estão representados no código, com diferentes níveis de evidência e sem alegação de cobertura exaustiva.

A homologação real fortalece a comprovação do núcleo de gestão e adoção. Permanecem como atividades de conclusão a operação com conta definitiva, a entrega real de e-mails, a validação da IA, a hospedagem pública e a revisão final. A existência dessas pendências é compatível com uma entrega parcial, desde que estejam explicitamente documentadas.

Este documento utiliza papel A4, fonte Arial, corpo 12, espaçamento de 1,5 linha, margens de 3 cm à esquerda e acima e 2 cm à direita e abaixo, sumário e paginação a partir da parte textual. A apresentação foi organizada com base na ABNT NBR 14724:2024; a normalização bibliográfica considera a orientação atual da biblioteca da UFES sobre referências e citações (ABNT, 2024; Universidade Federal do Espírito Santo, 2026). Regras institucionais específicas devem ser conferidas pela equipe antes do envio.

## REFERÊNCIAS

ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. ABNT NBR 14724: informação e documentação - trabalhos acadêmicos - apresentação. 4. ed. Rio de Janeiro: ABNT, 2024. Versão corrigida em 1 abr. 2025. Disponível em: https://engenhariaedesenvolvimentosustentavel.ufes.br/sites/engenhariaedesenvolvimentosustentavel.ufes.br/files/field/anexo/abnt_nbr_14724.pdf . Acesso em: 27 out. 2026.

EQUIPE ANJOS DE PATAS. TED 1: diagnóstico da demanda, levantamento de requisitos e planejamento da solução. Balsas: UNIBALSAS, 2026a. Documento acadêmico do projeto.

EQUIPE ANJOS DE PATAS. TED 2 Anjos de Patas: documento técnico, versão 2. Balsas: UNIBALSAS, 2026b. Documento acadêmico do projeto.

EQUIPE ANJOS DE PATAS. Anjos-de-Patas: código-fonte do portal. [S. l.]: GitHub, 2026c. Branch fix/consulta-animal-por-nome, commit be388a6. Disponível em: https://github.com/Anjos-de-Patas/Anjos-de-Patas/tree/fix/consulta-animal-por-nome . Acesso em: 27 out. 2026.

EXPRESS. Express: Node.js web application framework. [S. l.], [s.d.]. Disponível em: https://expressjs.com/ . Acesso em: 27 out. 2026.

GOOGLE. Gemini API. [S. l.], [s.d.]. Disponível em: https://ai.google.dev/gemini-api/docs . Acesso em: 27 out. 2026.

OPENJS FOUNDATION. About Node.js. [S. l.], [s.d.]. Disponível em: https://nodejs.org/en/about . Acesso em: 27 out. 2026.

SUPABASE. Row Level Security. [S. l.], [s.d.]. Disponível em: https://supabase.com/docs/guides/database/postgres/row-level-security . Acesso em: 27 out. 2026.

UNIVERSIDADE FEDERAL DO ESPÍRITO SANTO. Sistema Integrado de Bibliotecas. Normalização. Vitória: UFES, 2026. Disponível em: https://biblioteca.ufes.br/normalizacao . Acesso em: 27 out. 2026.
