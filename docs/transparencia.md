# Transparência e resultados

A página `pages/transparencia.html` apresenta indicadores operacionais consultados em `GET /api/resultados`, sem exigir login. O servidor usa seu cliente administrativo somente para contar registros e devolve `sucesso`, `atualizado_em` (ISO UTC) e `dados`:

- `animais_acolhidos`: animais cuja situação atual é diferente de `adotado`.
- `disponiveis`: animais com situação `disponivel`.
- `adocoes_registradas`: total acumulado de adoções registradas, sem recorte anual.

As contagens representam os cadastros da plataforma, sem estimar o histórico completo da ONG. A data indica o momento da consulta, exibido no horário de Brasília. Zero é um resultado válido. Se qualquer consulta falhar ou retornar contagem inválida, a API responde 503 sem números parciais; a interface oculta os indicadores anteriores e oferece nova tentativa.

A resposta pública não contém nomes, contatos, mensagens, identificadores de adotantes ou credenciais. Nenhuma alteração de schema é necessária. Relatórios financeiros, atividades e documentos institucionais aparecem como ainda não publicados; nenhum arquivo oficial é simulado.

O conteúdo também explica o uso dos dados de interesse e da conta. Os formulários possuem links para essa seção. Os canais oficiais continuam dependendo do cadastro pela equipe.

Validação: `node --test --test-isolation=none test/*.test.js`. Os cenários específicos estão em `test/transparencia.test.js`.
