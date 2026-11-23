# Documento Técnico do Projeto - Versão 4.0 (versão final)

Fonte das seções 32 a 40 do Documento Técnico do Projeto, versão 4.0 (TED 4 - entrega da solução completa e apresentação final). O PDF é gerado por docs/gerar_documento_v4.py, que mantém integralmente as seções 1 a 31 da versão 3.0 e numera as seções abaixo a partir de 32. Revisão de 23 de novembro de 2026.

## 1 Finalidade e composição da versão final

Esta é a versão final do Documento Técnico do Projeto. Ela consolida as quatro etapas desenvolvidas ao longo do semestre: o diagnóstico da demanda e o planejamento (TED 1), o desenvolvimento da interface (TED 2), o back-end, a persistência e a integração (TED 3) e a conclusão da solução com validação e apresentação dos resultados (TED 4).

Conforme solicitado, o conteúdo das versões anteriores foi preservado sem alterações: as seções 1 a 19 reproduzem a versão 2.0 e as seções 20 a 31 reproduzem a versão 3.0. As seções 32 a 40 foram acrescentadas nesta versão e tratam da evolução do projeto, da validação da solução, dos resultados obtidos, das melhorias implementadas, das dificuldades encontradas, dos artefatos da entrega final e das considerações finais. Quando houver diferença entre seções, prevalecem as informações mais recentes.

## 2 Evolução do projeto

O projeto partiu de um problema concreto da Sociedade Protetora dos Animais Anjos de Patas: informações dos animais distribuídas em planilhas, conversas e anotações, sem histórico centralizado e com controle manual das adoções. A cada etapa, a solução avançou do planejamento para uma aplicação web publicada, com área pública, área administrativa, conta do adotante e assistente de adoção.

| Etapa e período | Principais entregas |
| --- | --- |
| TED 1 - agosto e setembro/2026 | Diagnóstico com a ONG, personas, requisitos RF01 a RF16, requisitos não funcionais, arquitetura, tecnologias, cronograma e protótipos no Figma |
| TED 2 - setembro e outubro/2026 | Página inicial responsiva com filtros, assistente de adoção integrado, autenticação da equipe, dashboard, perfil e upload de fotos dos animais |
| TED 3 - outubro e novembro/2026 | Modelagem e scripts do banco, regras de negócio, adoção transacional, RLS, área do adotante, gestão de interessados, resgates, transparência, perguntas frequentes, contrato OpenAPI, homologação real e publicação |
| TED 4 - novembro/2026 | Estabilidade e memória do assistente, modo guiado sem IA, página do ANJOS IA (Dify), preenchimento do animal no registro de adoção, rotina que mantém o banco ativo, validação com a ONG e consolidação da documentação |

O histórico completo de alterações está registrado nos commits do repositório, entre 23 de setembro e 20 de novembro de 2026.

## 3 Validação da solução

A validação foi conduzida em três frentes: verificações técnicas da aplicação em funcionamento, relatos de pessoas que utilizaram o assistente como adotantes em teste e o retorno da própria ONG após conhecer a aplicação publicada.

| Validação | Resultado e evidência |
| --- | --- |
| Homologação funcional ponta a ponta (27/10/2026) | 20 cenários, do cadastro do animal ao registro da adoção, todos aprovados, com Supabase real e dados fictícios (docs/evidencias/homologacao-real-20261027) |
| Verificação da versão publicada (05/11/2026) | Páginas públicas, catálogo, transparência e bloqueio da área administrativa sem login conferidos no ambiente publicado (docs/evidencias/verificacao-publicada-20261105) |
| Testes automatizados (23/11/2026) | 110 testes aprovados e nenhuma falha na branch main (docs/evidencias/testes-20261123) |
| Adotantes em teste do assistente | Relatos de falha ao enviar mensagens em sequência e após várias perguntas; causas identificadas e corrigidas, conforme a seção 36 (docs/refinamento-assistente.md) |
| Retorno da ONG | Avaliação inicial positiva da aplicação publicada, feita pelo celular (Figura 20) |

![Retorno da ONG Anjos de Patas pelo WhatsApp após conhecer a aplicação publicada](docs/evidencias/validacao-ong/retorno-ong-whatsapp.png)

No retorno, a ONG informou que verificou algumas informações pelo celular, que precisava olhar no navegador do computador para ver mais especificações e que já havia gostado da solução. O registro confirma que a aplicação publicada foi acessada pela instituição em um celular, o que está de acordo com o requisito de responsividade (RNF01), e que a primeira impressão foi favorável.

Esse retorno corresponde a uma avaliação inicial e não substitui uma validação detalhada das funcionalidades. Para concluí-la, propõe-se um roteiro a ser aplicado com a responsável e com voluntários da ONG: consultar e filtrar os animais disponíveis, abrir o perfil de um animal, manifestar interesse, acessar a área administrativa, cadastrar um animal com foto, registrar uma vacina, aprovar um interessado e registrar a adoção, verificando se o histórico permanece disponível. Os resultados dessa sessão, quando realizada, devem ser acrescentados a esta seção com data, participantes, tarefas concluídas e ajustes solicitados.

## 4 Resultados obtidos

Todos os requisitos funcionais definidos na TED 1 foram implementados e verificados na aplicação. O quadro a seguir relaciona cada grupo de requisitos à funcionalidade correspondente.

| Requisitos | Funcionalidade implementada |
| --- | --- |
| RF01 | Login da equipe com Supabase Auth, perfis ativos e recuperação de senha por código |
| RF02, RF03 e RF11 | Cadastro e edição de animais com foto, características e situação (em tratamento, disponível ou adotado) |
| RF04 e RF05 | Lista de animais cadastrados com pesquisa por nome e filtro por situação |
| RF06 a RF10 | Registro de resgate, saúde, vacinas e tratamentos vinculados ao animal e consulta do histórico individual |
| RF12 e RF13 | Seção Adote com os animais disponíveis, filtros por espécie e sexo e perfil público de cada animal |
| RF14 e RF15 | Registro da adoção em transação, com mudança automática da situação para adotado e bloqueio de duplicidade |
| RF16 | Histórico preservado após a adoção, confirmado na homologação de 27/10/2026 |

Além do escopo inicial, a solução passou a oferecer manifestação de interesse pelo perfil do animal, conta do adotante com acompanhamento das etapas do pedido, gestão de interessados pela equipe, página de transparência com indicadores calculados pelo sistema, perguntas frequentes e o assistente Anjos IA, que recomenda animais a partir das preferências e da rotina informadas pela pessoa.

Em números, a entrega final reúne 34 operações de API documentadas no contrato OpenAPI, 110 testes automatizados aprovados, 20 cenários de homologação aprovados e a aplicação publicada em https://anjos-de-patas.netlify.app. Os animais exibidos na versão publicada são fictícios e identificados como dados de teste até que a ONG cadastre os seus.

## 5 Melhorias implementadas ao longo do desenvolvimento

| Melhoria | Motivo |
| --- | --- |
| Perfil público do animal com o botão Manifestar interesse | Os cards do protótipo não levavam a uma ficha completa e o contato dependia de um WhatsApp ainda não informado pela ONG |
| Conta do adotante com etapas e histórico do pedido | Permitir que a pessoa acompanhe o andamento sem precisar contatar a equipe |
| Dashboard restrito a indicadores controlados pelo sistema | O protótipo exibia doações, estoque e alertas que não fazem parte dos requisitos |
| Filtros separados por espécie e sexo | O filtro Ambos do protótipo misturava critérios e gerava dúvida |
| Separação dos acessos da equipe e do adotante | Testes mostraram risco de uma conta acessar a área da outra |
| Limite próprio de mensagens, novas tentativas e modo guiado no assistente | Adotantes em teste relataram falhas ao enviar mensagens em sequência; o provedor de IA recusava chamadas repetidas |
| Estado da conversa assinado e devolvido ao navegador | Na hospedagem em funções, cada mensagem podia ser atendida por uma instância diferente e o contexto se perdia |
| Preferências interpretadas pela IA, sem perguntas repetidas | O assistente insistia em perguntas quando a pessoa respondia que não tinha preferência |
| Modo guiado quando os créditos da IA acabam | Manter o atendimento disponível mesmo sem acesso ao modelo |
| Página pública do ANJOS IA (Dify) | Oferecer uma segunda forma de conversa que consulta apenas o catálogo público |
| Animal de interesse preenchido no registro de adoção | Reduzir passos e erros da equipe ao concluir uma adoção |
| Rotina agendada que mantém o banco ativo | O banco do plano gratuito era pausado por inatividade e o catálogo ficava vazio |

## 6 Principais dificuldades encontradas e soluções

As dificuldades técnicas da etapa de back-end estão descritas na seção 28. Na etapa final, as principais dificuldades e as soluções adotadas foram as seguintes.

| Dificuldade | Solução adotada |
| --- | --- |
| Limites do plano gratuito da API de IA (recusas e fim dos créditos) | Novas tentativas automáticas antes de exibir a resposta e modo guiado, que consulta o banco sem usar o modelo |
| Perda do contexto da conversa na hospedagem em funções | Estado da conversa assinado com HMAC-SHA256, devolvido ao navegador e conferido pelo servidor, sem gravar conversas no banco |
| Pausa do banco gratuito por inatividade | Função agendada na Netlify e rotina no GitHub Actions que consultam a aplicação periodicamente |
| Ausência de canais oficiais de contato da ONG | Manifestação de interesse pelo próprio sistema e aviso de que os canais oficiais ainda serão cadastrados |
| Ausência de dados reais dos animais | Lote fictício identificado como dado de teste, removível sem afetar a estrutura do sistema |

Permanecem como limitações: a validação detalhada com a equipe da ONG ainda precisa ser registrada, os três perfis da equipe compartilham as mesmas permissões, uma conta de adotante acompanha um interesse por vez e não foram realizados testes de carga nem auditoria completa de acessibilidade.

## 7 Entrega final e instruções de uso

O repositório https://github.com/Anjos-de-Patas/Anjos-de-Patas contém a versão final do código-fonte, os scripts de criação e configuração do banco de dados (docs/database e docs/migrations), o contrato da API (docs/openapi.json), os testes automatizados (test) e as evidências de validação (docs/evidencias). As instruções de instalação e execução estão no README.md e na seção 29.

A aplicação está publicada em https://anjos-de-patas.netlify.app, com a área administrativa em https://anjos-de-patas.netlify.app/pages/login e o ANJOS IA em https://anjos-de-patas.netlify.app/pages/assistente-dify. Acompanham esta versão o manual simplificado do usuário, a apresentação em formato pitch e o vídeo de demonstração do funcionamento da aplicação, cujos links são informados no README.md do repositório.

## 8 Considerações finais

O projeto alcançou o objetivo definido na TED 1: oferecer à Anjos de Patas uma plataforma única para cadastrar os animais, acompanhar o histórico de resgate e saúde, divulgar os animais disponíveis e registrar as adoções sem perder informações. Todos os requisitos funcionais planejados foram implementados, e a solução foi ampliada com recursos que surgiram da própria prototipação e dos testes, como a conta do adotante, a gestão de interessados e o assistente de adoção.

Ao longo do semestre, a equipe aprendeu que decisões de design e de arquitetura precisam ser revistas a partir de evidências: os cards do protótipo ganharam uma ficha completa, o dashboard perdeu indicadores que o sistema não controla e o assistente foi reconstruído em vários pontos a partir dos relatos de quem o utilizou. Também ficou clara a importância de documentar limites com honestidade, separando o que foi validado do que ainda precisa ser confirmado.

Como próximos passos, recomenda-se concluir a validação detalhada com a equipe da ONG, cadastrar os animais reais e os canais oficiais de contato, diferenciar as permissões dos perfis da equipe e realizar uma avaliação completa de acessibilidade antes do uso contínuo pela instituição.

## 9 Histórico de versões atualizado

| Versão | Registro |
| --- | --- |
| 1.0 - agosto/2026 | Diagnóstico da demanda, apresentação da instituição, requisitos RF01 a RF16, requisitos não funcionais, arquitetura, tecnologias, cronograma e protótipos |
| 2.0 - outubro/2026 | Início da implementação, integração entre front-end, back-end e banco de dados, página pública, assistente de adoção, autenticação, dashboard, perfil e evidências da interface |
| 3.0 - novembro/2026 | Back-end completo, modelagem e scripts do banco, adoção transacional, RLS, conta do adotante, acompanhamento, contrato OpenAPI, testes automatizados, homologação real e publicação |
| 4.0 - novembro/2026 (final) | Evolução do projeto, validação da solução, resultados obtidos, melhorias implementadas, dificuldades e soluções da etapa final, entrega final e considerações finais |
