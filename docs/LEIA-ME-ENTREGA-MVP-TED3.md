# Entrega do MVP parcial - Anjos de Patas

Revisão: 5 de novembro de 2026.

## Documento principal

`output/pdf/Relatorio-MVP-TED3-Anjos-de-Patas-atualizado.pdf` - documento técnico versão 3.0, com 20 páginas A4 no papel timbrado do curso de ADS da UNIBALSAS (imagens em `docs/modelos/timbrado-ads/`). Segue a estrutura e o estilo da TED 1 e da TED 2 e contém identificação da equipe, arquitetura e tecnologias, funcionalidades, evidências (13 figuras), resultados dos testes, dificuldades e soluções, planejamento das atividades restantes, links, histórico de versões e referências. Os PDFs anteriores não foram sobrescritos.

O conteúdo editável fica em `docs/Relatorio-MVP-TED3-atualizado.md`. O gerador é `docs/gerar_relatorio_mvp_atualizado.py`, com dependências ReportLab, pypdf, pypdfium2 e Pillow. A geração utiliza as fontes Arial do Windows e as capturas e o JSON de homologação. A formatação foi organizada a partir da ABNT NBR 14724:2024 e da orientação de normalização da UFES; eventuais regras específicas da disciplina devem ser conferidas pela equipe.

## Links para a entrega

- Repositório oficial: https://github.com/Anjos-de-Patas/Anjos-de-Patas
- Aplicação publicada: https://anjos-de-patas.netlify.app (Netlify; até 05/11/2026 a aplicação ficava em https://anjos-de-patas.onrender.com)

O código da etapa está na branch `main`. As alterações foram revisadas no PR #1 (https://github.com/Anjos-de-Patas/Anjos-de-Patas/pull/1) e integradas em 28/10/2026. A homologação real de 27/10 foi executada no commit `be388a6`, anterior à integração.

Para demonstração local: executar `npm ci` e `npm start` na `main`, com o ambiente configurado, e abrir `http://localhost:3000`.

## Resultados

- 99 testes automatizados aprovados na `main` em 05/11/2026; a suíte usa dependências simuladas em vários cenários.
- 20 cenários de homologação aprovados em 27/10 com a API Express local e Supabase Auth, PostgreSQL e Storage reais.
- Separação de acesso entre equipe e adotante verificada no ambiente publicado em 28/10.
- Páginas públicas, catálogo, transparência e bloqueio da área administrativa verificados no ambiente publicado em 05/11.
- Sete capturas da interface com dados fictícios persistidos durante a homologação.
- Remoção verificada dos registros, da imagem e das contas temporárias.

As evidências estão em `docs/evidencias/homologacao-real-20261027/`, `docs/evidencias/verificacao-publicada-20261105/` e `docs/dados-teste/`. Não há senhas ou tokens nos materiais de entrega. O script de homologação não é um teste automático de rotina: cria dados no Supabase e sua reexecução deve ser revisada e autorizada.

## Manutenção do ambiente

O Supabase do plano gratuito pausa projetos sem uso por 7 dias. A rotina `.github/workflows/manter-ativo.yml` consulta o catálogo publicado a cada 2 dias para evitar a pausa. Se a aplicação voltar a responder com erro ao listar animais, conferir no painel do Supabase se o projeto foi pausado e restaurá-lo.

## Pendências explícitas

1. Criar a conta administrativa definitiva para a equipe da ONG.
2. Configurar e testar a entrega e o recebimento de confirmação e recuperação por e-mail.
3. Homologar o Gemini com cenários registrados.
4. Repetir o fluxo completo de cadastro até adoção no ambiente publicado.
5. Confirmar responsáveis e prazos do planejamento proposto e realizar a revisão final da equipe.

O relatório fundamenta a classificação como MVP parcial; não declara produção pronta nem substitui a avaliação do professor. Blog e histórias de adoção estão fora do escopo da interface entregue.
