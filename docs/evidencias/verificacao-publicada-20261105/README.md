# Verificação da aplicação publicada - 05/11/2026

- Endereço: https://anjos-de-patas.onrender.com
- Código: branch `main`. O conteúdo da aplicação é idêntico ao commit `7960c8f` publicado no Render.
- Testes automatizados: 99 aprovados, nenhuma falha ([testes-automatizados-99.txt](testes-automatizados-99.txt)).
- Verificações HTTP no ambiente publicado: páginas públicas, `/health`, catálogo (9 animais fictícios), transparência e bloqueio da área administrativa sem login (401). Arquivos internos como `.env` não são servidos (404). Detalhes em [resultado.json](resultado.json).
- Capturas do ambiente publicado (Chrome sem interface, 05/11/2026), usadas nas Figuras 1 a 6 e 8 do relatório: `inicio-1440.jpg`, `catalogo-1440.jpg`, `perfil-animal-1440.jpg`, `perguntas-frequentes-1440.png`, `cadastro-adotante-1440.png`, `inicio-390.jpg` e `login-equipe-1440.png`. Os animais exibidos são fictícios.

Verificações anteriores no mesmo endereço, de 28/10/2026:

- [Publicação no Render](../../dados-teste/20261028-deploy-render.json)
- [Separação de acesso entre equipe e adotante](../../dados-teste/20261028-permissoes-acesso.json)

## Incidente e solução

O Supabase do plano gratuito pausou o projeto por inatividade. Com isso, a API publicada retornava erro 500 ao consultar o banco. O projeto foi restaurado no painel do Supabase. Para evitar uma nova pausa, foi criada a rotina [manter-ativo.yml](../../../.github/workflows/manter-ativo.yml), que consulta o catálogo a cada 2 dias pelo GitHub Actions.
