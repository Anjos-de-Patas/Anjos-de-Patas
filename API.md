# API Anjos de Patas

Base local: `http://localhost:3000`

## Configuracao

Crie um arquivo `.env` no backend:

```env
SUPABASE_URL=...
SUPABASE_KEY=...
GEMINI_API_KEY=...
FRONTEND_URL=http://localhost:5173
PORT=3000
```

Iniciar:

```bash
npm install
npm run dev
```

## Autenticacao

`POST /api/login`

```json
{
  "email": "usuario@exemplo.com",
  "password": "senha"
}
```

As rotas internas exigem:

```text
Authorization: Bearer <token>
```

O usuario tambem precisa possuir `app_metadata.role` ou `user_metadata.role` com um destes valores:

```text
admin | voluntario | veterinario
```

## Animais

### Catalogo publico

`GET /api/animais`

Por padrao retorna apenas animais com situacao `disponivel`.

Filtros opcionais:

```text
?nome=Mel&especie=cao&sexo=femea&porte=medio&faixa_etaria=adulto
```

### Listagem interna

`GET /api/admin/animais`

Retorna animais de todas as situacoes para usuarios autorizados.

### Criar animal

`POST /api/animais`

```json
{
  "nome": "Mel",
  "especie": "cao",
  "sexo": "femea",
  "porte": "medio",
  "faixa_etaria": "adulto",
  "temperamento": "tranquila",
  "convivencia_criancas": true,
  "convivencia_outros_animais": true,
  "situacao": "disponivel"
}
```

### Atualizar animal

`PUT /api/animais/:id`

Aceita qualquer subconjunto dos campos do cadastro.

## Historico

Todas as rotas abaixo exigem autenticacao e permissao interna.

```text
GET  /api/animais/:id/historico
POST /api/animais/:id/resgates
POST /api/animais/:id/saude
POST /api/animais/:id/vacinas
POST /api/animais/:id/tratamentos
```

Os registros usam `animal_id` como chave estrangeira. As tabelas esperadas sao `resgates`, `registros_saude`, `vacinas` e `tratamentos`.

## Adocoes

```text
POST /api/adocoes
GET  /api/adocoes
```

Exemplo de cadastro:

```json
{
  "animal_id": 1,
  "adotante_id": 2,
  "data_adocao": "2026-09-25",
  "observacoes": "Acompanhamento inicial em 30 dias"
}
```

O backend impede a adocao duplicada e altera a situacao do animal para `adotado`.

## Busca inteligente

`POST /api/busca-inteligente`

```json
{
  "texto": "Quero um cachorro medio que conviva com criancas"
}
```

A resposta inclui a mensagem humanizada, os criterios identificados e os animais encontrados. A rota possui limite de requisicoes para controlar o consumo da API de IA.

## Agente de adocao

`POST /api/agente`

O agente interpreta a mensagem e pode consultar animais disponiveis, obter detalhes publicos, explicar requisitos gerais ou encaminhar o atendimento para um voluntario.

```json
{
  "mensagem": "Quero um cachorro pequeno que conviva com criancas",
  "conversa_id": "opcional"
}
```

Resposta:

```json
{
  "sucesso": true,
  "conversa_id": null,
  "mensagem": "Encontrei animais que podem combinar com o que voce procura.",
  "ferramentas_usadas": ["buscar_animais"]
}
```

O `conversa_id` funciona como identificador de correlacao nesta primeira versao; o historico da conversa ainda nao e persistido.

## Respostas de erro

As respostas seguem o formato:

```json
{
  "sucesso": false,
  "erro": "Mensagem do erro"
}
```

## Health check

`GET /health`

Retorna `200` quando o processo esta ativo.
