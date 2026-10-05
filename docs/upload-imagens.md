# Fotos dos animais

Na página Animais, use Enviar foto do animal no cadastro ou na edição. São aceitos JPG, PNG e WebP de até 5 MB. A prévia aparece antes de salvar; o campo de link continua disponível como alternativa. Remover foto limpa a imagem do animal.

Antes de usar, execute `migrations/20261005_upload_animal.sql` no SQL Editor do Supabase para criar a coluna `imagem_url` e configurar o armazenamento. Se o bucket não existir, a API cria `animais-imagens` automaticamente no primeiro upload. A coluna ainda precisa ser criada pelo SQL.

O endpoint `POST /api/animais/imagem` recebe os bytes da imagem com Content-Type `image/jpeg`, `image/png` ou `image/webp`. Exige token Bearer e perfil autorizado da ONG. A resposta contém `imagem_url`, usada ao cadastrar ou atualizar o animal. A chave administrativa do Supabase fica apenas no servidor.

As fotos são públicas para exibição no catálogo. Ao remover ou substituir uma foto, o arquivo antigo permanece no Storage.

Validação: `npm test`. Em ambientes que bloqueiam subprocessos: `node --test --test-isolation=none test/*.test.js`.
