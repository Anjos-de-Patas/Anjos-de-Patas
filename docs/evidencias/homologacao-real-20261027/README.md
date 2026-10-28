# Homologação real do MVP - 27/10/2026

Código avaliado: branch `fix/consulta-animal-por-nome`, commit `be388a61949a3bddf616d7e698686b819a7fb0db`, no repositório oficial Anjos-de-Patas/Anjos-de-Patas.

Ambiente: interface e API Express executadas localmente; Supabase Auth, PostgreSQL e Storage remotos reais. Não foi utilizada API simulada neste conjunto. As operações de cadastro foram realizadas por HTTP automatizado e seus resultados foram consultados na interface.

Os nomes, contatos, animal, resgate e registros de saúde são fictícios. A imagem de teste de upload é a marca do projeto. As três contas foram criadas com confirmação administrativa, usando endereços reservados em `example.com`; não houve teste de entrega de e-mail. Senhas aleatórias e tokens não integram estes artefatos.

O arquivo `resultado.json` contém os cenários, os status HTTP, a lista de capturas e o resultado da limpeza. Os dados temporários e a imagem foram excluídos pelos IDs gerados pelo ensaio; as contas temporárias foram removidas. As contagens operacionais foram comparadas antes e depois. As sequências de IDs podem avançar durante o teste.

As capturas mostram painel, histórico do animal, interessados, acompanhamento do adotante e transparência. As telas do adotante e de transparência foram registradas também em 360 pixels. Os números correspondem ao instante da homologação, com dados fictícios, e não devem ser apresentados como estatísticas oficiais da ONG.

## Limites

- Reabertura do servidor HTTP no mesmo processo Node; não foi reiniciado o sistema operacional.
- E-mails de confirmação e recuperação não foram enviados nem recebidos neste ensaio.
- Integração Gemini não executada nesta homologação.
- Sem teste de carga, pentest ou auditoria completa de acessibilidade.
- As capturas não substituem os testes nem comprovam usabilidade com pessoas da ONG.

## Artefatos

- `resultado.json`: resultado estruturado dos 20 cenários e limpeza.
- `testes-automatizados-69.txt`: saída da suíte atual com dependências simuladas.
- Sete arquivos PNG: capturas reais durante o teste.
- `../../Relatorio-MVP-TED3-atualizado.md`: conteúdo editável do relatório.
- `../../../output/pdf/Relatorio-MVP-TED3-Anjos-de-Patas-atualizado.pdf`: documento atualizado da entrega.

O script de homologação fica em `scripts/homologar-mvp-real.mjs`, na cópia de trabalho. Sua reexecução escreve dados no projeto configurado e exige acesso administrativo; não é executado por `npm test`.
