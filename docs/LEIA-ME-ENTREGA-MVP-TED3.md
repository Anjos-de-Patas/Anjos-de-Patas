# Entrega do MVP parcial - Anjos de Patas

Revisão: 27 de outubro de 2026.

## Documento principal

`output/pdf/Relatorio-MVP-TED3-Anjos-de-Patas-atualizado.pdf` - 25 páginas A4, com identificação da equipe, arquitetura, funcionalidades, evidências reais, resultados dos testes, dificuldades, planejamento e referências. Possui sumário e paginação. Os PDFs anteriores não foram sobrescritos.

O conteúdo editável fica em `docs/Relatorio-MVP-TED3-atualizado.md`. O gerador é `docs/gerar_relatorio_mvp_atualizado.py`, com dependências ReportLab, pypdf, pypdfium2 e Pillow. A geração utiliza as fontes Arial do Windows e as capturas e o JSON de homologação. A formatação foi organizada a partir da ABNT NBR 14724:2024 e da orientação de normalização da UFES; eventuais regras específicas da disciplina devem ser conferidas pela equipe.

## Links para a entrega

- Repositório oficial: https://github.com/Anjos-de-Patas/Anjos-de-Patas
- Versão parcial implementada: https://github.com/Anjos-de-Patas/Anjos-de-Patas/tree/fix/consulta-animal-por-nome
- Commit do código homologado: https://github.com/Anjos-de-Patas/Anjos-de-Patas/commit/be388a61949a3bddf616d7e698686b819a7fb0db
- PR em revisão: https://github.com/Anjos-de-Patas/Anjos-de-Patas/pull/1
- Aplicação pública: ainda sem URL verificada. Para demonstração local, executar `npm ci` e `npm start` na versão da branch, com o ambiente configurado, e abrir `http://localhost:3000`. Esse endereço não é acessível externamente.

Os documentos e evidências desta revisão acompanham esta branch. O commit acima identifica o código efetivamente homologado; o commit posterior de documentação não altera a implementação avaliada.

## Resultados

- 69 testes automatizados aprovados; a suíte usa dependências simuladas em vários cenários.
- 20 cenários de homologação aprovados com a API Express local e Supabase Auth, PostgreSQL e Storage reais.
- Sete capturas da interface com dados fictícios persistidos durante a homologação.
- Remoção verificada dos registros, da imagem e das três contas temporárias; retorno das contagens operacionais aos valores iniciais.

Os resultados estruturados e as imagens estão em `docs/evidencias/homologacao-real-20261027/`. Não há senhas ou tokens nos materiais de entrega. O script de homologação não é um teste automático de rotina: cria dados no Supabase e sua reexecução deve ser revisada e autorizada.

## Pendências explícitas

1. Criar a conta administrativa definitiva para a equipe da ONG.
2. Configurar e testar a entrega e o recebimento de confirmação e recuperação por e-mail.
3. Configurar a chave e homologar chamadas reais ao Gemini.
4. Hospedar a aplicação e conferir o fluxo pelo endereço público.
5. Confirmar responsáveis e prazos do planejamento proposto e realizar a revisão final da equipe.

O relatório fundamenta a classificação como MVP parcial; não declara produção pronta nem substitui a avaliação do professor. Blog e histórias de adoção estão fora do escopo da interface entregue.
