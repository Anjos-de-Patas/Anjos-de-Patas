# PROJETO DE SOLUÇÃO WEB PARA A ONG ANJOS DE PATAS

Documento Técnico do Projeto - Versão 3.0. Fonte editável do relatório da TED 3; o PDF é gerado por docs/gerar_relatorio_mvp_atualizado.py. Linhas iniciadas por "## " são seções primárias, "### " são subseções, "<!-- quadro: título | larguras -->" antecede um quadro, "![legenda](caminho)" insere uma figura e duas figuras na mesma linha são exibidas lado a lado.

## 1 INTRODUÇÃO

A Sociedade Protetora dos Animais Anjos de Patas, de Balsas - MA, dedica-se ao resgate, ao cuidado e à busca de um novo lar para cães e gatos em situação de abandono ou maus-tratos (Anjos de Patas, 2026). No início do projeto, a equipe percebeu que boa parte das informações sobre esses animais ficava espalhada em planilhas, conversas e anotações, o que tornava difícil acompanhar a história de cada um, desde o resgate até a adoção (Equipe Anjos de Patas, 2026a).

Foi a partir dessa realidade que surgiu a proposta de um sistema web para reunir essas informações em um só lugar e aproximar a ONG das pessoas que desejam adotar. Na etapa anterior, foram construídas as primeiras telas, a página pública e o assistente de adoção (Equipe Anjos de Patas, 2026b). Nesta terceira etapa, o sistema passa a acompanhar todo o caminho de um animal: a equipe registra sua chegada e seus cuidados, o animal aparece no catálogo, uma pessoa demonstra interesse, a ONG avalia o pedido e, por fim, a adoção é registrada sem que a história do animal se perca.

A aplicação já está publicada na internet e pode ser acessada por qualquer pessoa. Este documento apresenta o que foi construído até aqui, como o sistema foi testado, os desafios enfrentados pela equipe e os próximos passos até a conclusão do MVP.

## 2 IDENTIFICAÇÃO DA EQUIPE

A equipe manteve a composição e a divisão de funções registradas na versão anterior do documento técnico.

<!-- quadro: Integrantes da equipe e funções | 0.45,0.55 -->
| Integrante | Função |
| --- | --- |
| Carinne da Silva Borges | Desenvolvedor Front-end / UI/UX |
| João Pedro Strasser Santos | Analista de Requisitos / QA |
| Júlio César Lima dos Reis | Banco de Dados / Back-end |
| Rogério Mota de Melo | Desenvolvedor Back-end |

## 3 ARQUITETURA E TECNOLOGIAS UTILIZADAS

O sistema mantém a arquitetura web definida nas etapas anteriores, composta por interface da aplicação (front-end), camada de aplicação (back-end) e banco de dados. Nesta versão, a arquitetura foi complementada com armazenamento de imagens, hospedagem pública e uma rotina automatizada de manutenção do ambiente. O fluxo principal das requisições segue a sequência navegador, API Express e serviços do Supabase (autenticação, banco PostgreSQL e armazenamento de arquivos).

### 3.1 Front-end

O front-end é composto por páginas em HTML5, estilizadas com CSS3 e controladas por JavaScript. A interface está organizada em três áreas: a área pública, destinada à consulta dos animais, às perguntas frequentes e aos indicadores de transparência; a área do adotante, na qual a pessoa interessada cria sua conta e acompanha o próprio pedido; e a área administrativa, restrita à equipe da ONG. As páginas consomem os dados exclusivamente por meio da API, sem acesso direto ao banco de dados.

### 3.2 Back-end

O back-end utiliza Node.js e Express para disponibilizar as rotas da API e aplicar as regras da aplicação (OpenJS Foundation, [s.d.]; Express, [s.d.]). As entradas são validadas com a biblioteca Zod antes de qualquer gravação. A segurança das requisições é reforçada por cabeçalhos HTTP configurados com Helmet, controle de origens com CORS e limitação de tentativas nas rotas de login e cadastro. As rotas administrativas verificam a sessão e o perfil ativo do usuário, e as rotas da área do adotante aceitam apenas contas de adotante, de modo que uma conta não acessa a área destinada à outra.

### 3.3 Banco de dados, autenticação e armazenamento

Os dados são armazenados em PostgreSQL por meio do Supabase, com políticas de segurança em nível de linha (Row Level Security) aplicadas às tabelas públicas (Supabase, [s.d.]a). A autenticação das contas da equipe e dos adotantes é realizada pelo Supabase Auth, e as fotografias dos animais são guardadas no Supabase Storage. O registro da adoção é executado por uma função do banco que bloqueia o animal e o adotante, atualiza a situação do animal e grava o histórico em uma única transação, o que impede adoções duplicadas e registros incompletos.

### 3.4 Hospedagem e manutenção do ambiente

A aplicação foi publicada inicialmente no serviço Render, em plano gratuito (Render, [s.d.]). Nesse plano, o servidor é suspenso após 15 minutos sem acesso, e o primeiro acesso seguinte levava cerca de um minuto, tempo excessivo para quem visita o site da ONG. Por isso, em 5 de novembro de 2026 a aplicação foi transferida para a Netlify, onde as páginas são entregues por uma rede de distribuição de conteúdo e a API passou a funcionar como função sob demanda (Netlify, [s.d.]). O endereço atual é https://anjos-de-patas.netlify.app. Para evitar que o banco de dados seja pausado por inatividade, foi criada uma rotina no GitHub Actions que consulta o catálogo publicado a cada dois dias (GitHub, [s.d.]). O código-fonte é versionado no GitHub, e as alterações desta etapa foram revisadas em pull request antes de serem integradas à branch principal.

O quadro a seguir resume as tecnologias utilizadas e a finalidade de cada uma, atualizando a relação apresentada na versão 2.0.

<!-- quadro: Tecnologias utilizadas | 0.32,0.68 -->
| Tecnologia | Utilização |
| --- | --- |
| HTML5, CSS3 e JavaScript | Estrutura, estilização e interações das páginas públicas, da área do adotante e da área administrativa |
| Node.js e Express | Execução do back-end e definição das rotas da API |
| Zod | Validação dos dados recebidos pela API |
| Helmet, CORS e express-rate-limit | Cabeçalhos de segurança, controle de origens e limitação de tentativas |
| PostgreSQL / Supabase | Armazenamento persistente, relações, políticas de acesso e função transacional de adoção |
| Supabase Auth | Autenticação e sessões das contas da equipe e dos adotantes |
| Supabase Storage | Armazenamento das fotografias dos animais |
| Google Gemini | Inteligência artificial utilizada pelo assistente de adoção |
| Netlify | Hospedagem pública da aplicação: páginas em rede de distribuição de conteúdo e API como função sob demanda (até 05/11/2026, Render) |
| GitHub e GitHub Actions | Versionamento, revisão do código e rotina de manutenção do ambiente |
| Node.js Test Runner | Execução dos testes automatizados |
| Visual Studio Code | Desenvolvimento e manutenção do código-fonte |

## 4 FUNCIONALIDADES IMPLEMENTADAS NESTA ETAPA

A implementação desta etapa concentrou-se na conclusão dos módulos administrativos previstos nos requisitos e na integração do fluxo de adoção entre a área pública, a área do adotante e a área da equipe.

### 4.1 Área pública

A página inicial apresenta a instituição, o processo de adoção e o catálogo de animais disponíveis, com filtros combináveis por espécie e sexo e paginação dos resultados. Cada animal possui uma página de perfil com suas características, como porte, faixa etária e convivência com crianças e outros animais, e o botão para manifestar interesse. Animais em tratamento ou já adotados não aparecem no catálogo nem no perfil público. A área pública também reúne uma página de perguntas frequentes sobre o processo de adoção e uma página de transparência, que exibe apenas indicadores agregados, como totais de resgates, animais acolhidos e adoções realizadas.

### 4.2 Assistente de adoção

O assistente de adoção, apresentado na versão anterior e baseado no Google Gemini (Google, [s.d.]), foi aprimorado para manter o contexto da conversa, exibir as respostas de forma progressiva (streaming) e mostrar miniaturas dos animais sugeridos. As recomendações são feitas a partir dos animais efetivamente disponíveis no banco de dados. O recurso permanece como apoio à consulta e não aprova adoções nem substitui a avaliação realizada pela equipe da ONG.

### 4.3 Conta do adotante e manifestação de interesse

A pessoa interessada pode criar uma conta, manifestar interesse por um animal e acompanhar a situação do pedido em uma área própria, organizada por etapas. As notas internas registradas pela equipe durante a avaliação não são exibidas ao adotante, e cada conta tem acesso apenas aos próprios pedidos. Também foi implementada a recuperação de senha por código.

### 4.4 Área administrativa

A área administrativa passou a contemplar o cadastro, a edição e a consulta dos animais, com envio de fotografia; o registro de resgates, cuidados de saúde, vacinas e tratamentos; a consulta do histórico individual de cada animal; a gestão dos interessados, com aprovação ou recusa e registro das etapas de acompanhamento; e o registro da adoção, que só é aceito após a aprovação do interessado. O painel administrativo apresenta os indicadores gerais da instituição a partir dos dados do banco. O acesso exige conta da equipe com perfil ativo, e perfis desativados perdem o acesso.

### 4.5 Atendimento aos requisitos funcionais

O quadro a seguir relaciona os requisitos funcionais definidos na TED 1 às funcionalidades implementadas e às evidências disponíveis nesta etapa.

<!-- quadro: Atendimento aos requisitos funcionais | 0.15,0.42,0.43 -->
| Requisitos | Funcionalidade implementada | Evidência |
| --- | --- | --- |
| RF01 | Login dos usuários autorizados da ONG | Login real, conta sem perfil e perfil inativo verificados |
| RF02 a RF05 | Cadastro, edição, listagem e pesquisa de animais | Cadastro e edição reais; testes de filtros e da consulta por nome |
| RF06 | Registro de resgate | Gravação e consulta reais por animal |
| RF07 a RF09 | Registro de saúde, vacinas e tratamentos | Três registros gravados e recuperados no banco |
| RF10 | Histórico individual do animal | Consulta do histórico após a adoção |
| RF11 a RF13 | Situação do animal e catálogo de adoção | Animal em tratamento e animal adotado fora do catálogo público |
| RF14 e RF15 | Registro da adoção e atualização da situação | Transação real, exigência de aprovação e bloqueio de duplicidade |
| RF16 | Histórico mantido após a adoção | Resgate, saúde, vacina, tratamento e adoção recuperados |

Os requisitos não funcionais também foram contemplados: a interface é responsiva (RNF01 e RNF08), as funções administrativas exigem autenticação e perfil autorizado (RNF02 e RNF03), os dados são persistidos em banco de dados (RNF04), e o sistema valida os campos obrigatórios e apresenta mensagens de confirmação ou erro (RNF06 e RNF07). A avaliação de usabilidade com usuários da ONG (RNF05) ainda será realizada.

## 5 EVIDÊNCIAS DO FUNCIONAMENTO

As figuras a seguir registram a aplicação em funcionamento. As capturas da área pública foram obtidas em 5 de novembro de 2026 no ambiente publicado. As capturas da área administrativa e da área do adotante foram obtidas em 27 de outubro de 2026, durante a homologação com os serviços reais do Supabase, após a execução do fluxo completo de adoção. Todos os animais e pessoas exibidos são fictícios e foram cadastrados apenas para demonstração e testes, uma vez que a ONG ainda não forneceu os cadastros e as fotografias reais para uso nesta etapa acadêmica.

### 5.1 Área pública publicada

![Página inicial da aplicação publicada](docs/evidencias/verificacao-publicada-20261105/inicio-1440.jpg)

![Catálogo de animais com filtros e paginação](docs/evidencias/verificacao-publicada-20261105/catalogo-1440.jpg)

![Perfil público de um animal disponível para adoção](docs/evidencias/verificacao-publicada-20261105/perfil-animal-1440.jpg)

![Página de perguntas frequentes](docs/evidencias/verificacao-publicada-20261105/perguntas-frequentes-1440.png)

![Cadastro da conta do adotante](docs/evidencias/verificacao-publicada-20261105/cadastro-adotante-1440.png)

![Página inicial em dispositivo móvel](docs/evidencias/verificacao-publicada-20261105/inicio-390.jpg) ![Indicadores de transparência em dispositivo móvel](docs/evidencias/homologacao-real-20261027/transparencia-360.png)

### 5.2 Área administrativa e acompanhamento da adoção

![Tela de login da área administrativa](docs/evidencias/verificacao-publicada-20261105/login-equipe-1440.png)

![Painel administrativo após o registro de uma adoção](docs/evidencias/homologacao-real-20261027/painel-1440.png)

![Histórico do animal preservado após a adoção](docs/evidencias/homologacao-real-20261027/animais-1440.png)

![Gestão de interessados com o acompanhamento concluído](docs/evidencias/homologacao-real-20261027/interessados-1440.png)

![Acompanhamento da adoção na conta do adotante](docs/evidencias/homologacao-real-20261027/adotante-1440.png)

![Indicadores públicos de transparência](docs/evidencias/homologacao-real-20261027/transparencia-1440.png)

## 6 RESULTADOS PRELIMINARES DOS TESTES

A validação da implementação foi realizada em três frentes complementares: testes automatizados, homologação com os serviços reais do Supabase e verificações no ambiente publicado. Em todas as frentes foram utilizados apenas dados fictícios, e os registros temporários criados durante os testes foram removidos ao final.

### 6.1 Testes automatizados

O back-end possui 99 testes automatizados, executados com o executor de testes nativo do Node.js. Os testes abrangem a validação dos dados de entrada, as rotas da API, o controle de acesso, o assistente de adoção, a área do adotante, a recuperação de senha e o comportamento de componentes da interface. Na execução de 5 de novembro de 2026, os 99 testes foram aprovados, sem falhas. Nesses testes, os serviços externos são simulados, o que permite verificar as regras da aplicação sem alterar o banco de dados real.

### 6.2 Homologação com os serviços reais

Em 27 de outubro de 2026, o fluxo principal foi executado contra o Supabase Auth, o banco PostgreSQL e o Supabase Storage reais, por meio de requisições à API. Foram criadas contas temporárias para a equipe e para dois adotantes, e um animal fictício percorreu todo o fluxo, do cadastro à adoção. Para verificar a persistência, o servidor foi encerrado e reiniciado, e os dados foram consultados novamente no banco. O quadro a seguir apresenta os cenários avaliados.

<!-- CENARIOS -->

### 6.3 Verificações no ambiente publicado

Em 28 de outubro de 2026, a separação de acessos foi verificada no endereço publicado. A conta de adotante acessou a própria área, mas foi impedida de entrar no login e no painel da equipe. A conta da equipe acessou o painel, mas foi impedida de entrar pelo login de adotante, e seu token foi recusado na área do adotante.

Em 5 de novembro de 2026, foram verificadas as páginas públicas, o catálogo, o perfil de um animal, os indicadores de transparência e o bloqueio da área administrativa sem login. Também se confirmou que arquivos internos da aplicação, como o arquivo de variáveis de ambiente, não são disponibilizados pelo servidor.

<!-- quadro: Verificações no ambiente publicado | 0.5,0.17,0.33 -->
| Verificação | Data | Resultado |
| --- | --- | --- |
| Adotante acessa a própria área | 28/10/2026 | Acesso permitido |
| Adotante tenta acessar o login e o painel da equipe | 28/10/2026 | Acesso negado |
| Equipe acessa o painel administrativo | 28/10/2026 | Acesso permitido |
| Equipe tenta acessar a área do adotante | 28/10/2026 | Acesso negado |
| Páginas públicas, catálogo e perfil do animal | 05/11/2026 | Disponíveis, com nove animais fictícios no catálogo |
| Indicadores de transparência | 05/11/2026 | Disponíveis |
| Área administrativa sem login | 05/11/2026 | Acesso negado |
| Arquivos internos da aplicação | 05/11/2026 | Não disponibilizados |

Os resultados indicam que o fluxo principal do MVP funciona com persistência real e que as regras de acesso são aplicadas no ambiente publicado. Ainda não foram realizados testes de desempenho sob carga, avaliação completa de acessibilidade e testes de usabilidade com a equipe da ONG.

## 7 DIFICULDADES ENCONTRADAS E SOLUÇÕES ADOTADAS

Durante o desenvolvimento desta etapa, algumas dificuldades exigiram ajustes no planejamento e na implementação. O quadro a seguir resume as principais dificuldades e as soluções adotadas pela equipe.

<!-- quadro: Dificuldades encontradas e soluções adotadas | 0.42,0.58 -->
| Dificuldade | Solução adotada |
| --- | --- |
| Gravação da adoção em etapas separadas, com risco de registros incompletos | Criação de uma função transacional no banco, com bloqueio do animal e do adotante e desfazimento automático em caso de erro |
| Alterações simultâneas no acompanhamento de um mesmo interessado | Controle de versão do registro, com aviso de conflito quando outra pessoa já alterou o pedido |
| Compartilhamento indevido da sessão entre usuários no servidor | Criação de um cliente de autenticação isolado para cada login e requisição |
| Conta de adotante e conta da equipe acessando áreas indevidas | Separação das rotas e verificação do tipo de conta em cada área |
| Instalação da estrutura em um banco de dados novo | Organização dos scripts de criação e das migrações em ordem de execução |
| Pausa do banco de dados no plano gratuito por inatividade | Restauração do projeto e criação de rotina no GitHub Actions que consulta o catálogo a cada dois dias |
| Servidor gratuito suspenso após período sem acesso | Transferência da hospedagem do Render para a Netlify, sem espera no primeiro acesso |
| Ausência de cadastros e fotografias reais da ONG | Uso de dados fictícios identificados como tais e imagens ilustrativas |

A pausa do banco de dados merece destaque. Em 5 de novembro de 2026, a aplicação publicada passou a apresentar erro ao listar os animais, e a investigação mostrou que o Supabase havia pausado o projeto por falta de uso, comportamento previsto no plano gratuito (Supabase, [s.d.]b). A equipe avaliou a substituição do banco de dados, mas a aplicação também depende do Supabase para autenticação, recuperação de senha e armazenamento de imagens, e a troca exigiria refazer essas partes e repetir a homologação. Optou-se, portanto, por restaurar o projeto e manter o banco em uso por meio da rotina automatizada descrita na seção 3.4.

## 8 PLANEJAMENTO DAS ATIVIDADES RESTANTES

As atividades restantes foram organizadas de acordo com o cronograma apresentado nas versões anteriores, que prevê a validação e os ajustes finais entre 19 e 24 de novembro e a entrega final em 28 de novembro de 2026. Os responsáveis foram definidos conforme as funções de cada integrante.

<!-- quadro: Planejamento das atividades restantes | 0.52,0.22,0.26 -->
| Atividade | Período | Responsável |
| --- | --- | --- |
| Criar a conta administrativa definitiva da ONG | 06/11 a 10/11/2026 | Júlio César e Rogério |
| Configurar e testar o envio de e-mails de confirmação e recuperação de senha | 06/11 a 12/11/2026 | Rogério |
| Homologar o assistente com o Google Gemini, com registro dos cenários | 10/11 a 14/11/2026 | Rogério |
| Cadastrar os animais reais da ONG, mediante autorização da instituição | 10/11 a 18/11/2026 | Equipe e ONG |
| Repetir o fluxo completo de adoção no ambiente publicado | 13/11 a 18/11/2026 | João Pedro |
| Revisar acessibilidade, navegação por teclado e legibilidade das telas | 13/11 a 18/11/2026 | Carinne |
| Avaliar a usabilidade com a equipe da ONG | 19/11 a 24/11/2026 | João Pedro e Carinne |
| Revisar a documentação técnica e os links finais | 19/11 a 24/11/2026 | Toda a equipe |
| Entrega final do sistema e da documentação | 28/11/2026 | Toda a equipe |

## 9 LINKS DO PROJETO

Repositório Git: https://github.com/Anjos-de-Patas/Anjos-de-Patas

Aplicação publicada: https://anjos-de-patas.netlify.app

Por utilizar um servidor gratuito, a aplicação pode levar até cerca de um minuto para responder no primeiro acesso após um período de inatividade. A área pública e o cadastro de adotante podem ser utilizados livremente. As operações da área administrativa exigem uma conta da equipe e podem ser demonstradas pelos integrantes.

## 10 HISTÓRICO DE VERSÕES

<!-- quadro: Histórico de versões | 0.1,0.2,0.7 -->
| Versão | Período | Descrição |
| --- | --- | --- |
| 1.0 | Agosto/2026 | Diagnóstico da demanda, levantamento de requisitos, definição da arquitetura, tecnologias, cronograma e protótipos iniciais |
| 2.0 | Outubro/2026 | Início da implementação, integração entre front-end, back-end e banco de dados, página pública responsiva, filtros, assistente de adoção, autenticação, dashboard e perfil |
| 3.0 | Novembro/2026 | Versão parcial do MVP: gestão de animais e históricos, conta do adotante, gestão de interessados, adoção transacional, transparência, publicação da aplicação, homologação real e 99 testes automatizados |

## 11 CONSIDERAÇÕES DA VERSÃO 3.0

A versão 3.0 registra a passagem das primeiras telas para um fluxo operacional completo. O sistema permite cadastrar um animal, registrar seu histórico, disponibilizá-lo para adoção, receber e avaliar o interesse de um adotante e registrar a adoção, mantendo o histórico preservado. Os requisitos funcionais RF01 a RF16 definidos na TED 1 estão implementados, e o funcionamento do fluxo principal foi comprovado com os serviços reais e no ambiente publicado.

O projeto permanece em desenvolvimento. As próximas etapas concentram-se na criação do acesso definitivo da ONG, na validação do envio de e-mails e do assistente com inteligência artificial, no cadastro dos animais reais e na avaliação de usabilidade com a equipe da instituição. A documentação continuará sendo atualizada para refletir apenas as funcionalidades efetivamente concluídas e validadas.

## REFERÊNCIAS

ANJOS DE PATAS. Apresentação Maio e Junho 2026. Balsas, MA, 2026. Material institucional.

EQUIPE ANJOS DE PATAS. TED 1: diagnóstico da demanda, levantamento de requisitos e planejamento da solução. Balsas: UNIBALSAS, 2026a. Documento acadêmico.

EQUIPE ANJOS DE PATAS. Projeto de solução web para a ONG Anjos de Patas: documento técnico do projeto, versão 2.0. Balsas: UNIBALSAS, 2026b. Documento acadêmico.

EXPRESS. Express: Node.js web application framework. [S. l.], [s.d.]. Disponível em: https://expressjs.com/ . Acesso em: 5 nov. 2026.

GITHUB. Events that trigger workflows. [S. l.], [s.d.]. Disponível em: https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows . Acesso em: 5 nov. 2026.

GOOGLE. Gemini API. [S. l.], [s.d.]. Disponível em: https://ai.google.dev/gemini-api/docs . Acesso em: 5 nov. 2026.

NETLIFY. Functions overview. [S. l.], [s.d.]. Disponível em: https://docs.netlify.com/functions/overview/ . Acesso em: 5 nov. 2026.

OPENJS FOUNDATION. About Node.js. [S. l.], [s.d.]. Disponível em: https://nodejs.org/en/about . Acesso em: 5 nov. 2026.

RENDER. Deploy for free. [S. l.], [s.d.]. Disponível em: https://render.com/docs/free . Acesso em: 5 nov. 2026.

SUPABASE. Row Level Security. [S. l.], [s.d.]a. Disponível em: https://supabase.com/docs/guides/database/postgres/row-level-security . Acesso em: 5 nov. 2026.

SUPABASE. About billing on Supabase. [S. l.], [s.d.]b. Disponível em: https://supabase.com/docs/guides/platform/billing-on-supabase . Acesso em: 5 nov. 2026.
