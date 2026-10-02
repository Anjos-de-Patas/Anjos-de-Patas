# Anjos de Patas

Projeto acadêmico desenvolvido na disciplina de **Programação para Web** do curso de **Análise e Desenvolvimento de Sistemas - UNIBALSAS**, em parceria com a Sociedade Protetora dos Animais Anjos de Patas, de Balsas - MA.

## Objetivo

Desenvolver uma aplicação web para apoiar a organização das informações dos animais atendidos pela ONG, facilitar a consulta de animais disponíveis para adoção e oferecer recursos de apoio ao processo de adoção.

## Equipe

| Integrante | Função |
| --- | --- |
| Carinne da Silva Borges | Analista de Requisitos / QA |
| João Pedro Strasser Santos | Desenvolvedor Front-end / UI/UX |
| Júlio César Lima dos Reis | Banco de Dados / Back-end |
| Rogério Mota de Melo | Desenvolvedor Back-end |

## Situação atual do repositório

O projeto está atualmente dividido em dois ramos:

- **main**: implementação da interface web com HTML, CSS e JavaScript.
- **dev**: implementação do back-end, API, integração com Supabase, autenticação, validações, testes e recursos de IA.

> A consolidação do front-end e do back-end em uma única linha de desenvolvimento ainda faz parte da evolução do projeto.

## Funcionalidades implementadas

### Interface - branch `main`

- página inicial da aplicação;
- apresentação institucional da ONG;
- seção de animais disponíveis para adoção;
- filtros por espécie e sexo;
- explicação do processo de adoção;
- seção de contato;
- seção de acesso ao assistente de adoção;
- layout responsivo para computadores, tablets e smartphones;
- uso inicial de recursos de acessibilidade, como `aria-label` e `aria-pressed`.

### Back-end - branch `dev`

- autenticação de usuários;
- listagem e cadastro de animais;
- atualização de dados dos animais;
- cadastro e acompanhamento de adotantes;
- registro de resgates;
- registro de informações de saúde;
- registro de vacinas e tratamentos;
- histórico individual dos animais;
- registro e consulta de adoções;
- dashboard;
- busca inteligente;
- agente de adoção com integração ao Gemini;
- validação de dados com Zod;
- controle de acesso por perfil;
- proteção de rotas;
- tratamento centralizado de erros;
- testes automatizados.

## Tecnologias utilizadas

### Front-end

- HTML5
- CSS3
- JavaScript

### Back-end

- Node.js
- Express
- Supabase
- PostgreSQL
- Google Generative AI / Gemini
- Zod
- Helmet
- CORS
- express-rate-limit
- dotenv
- Nodemon

### Ferramentas de projeto

- Git
- GitHub
- Figma

## Estrutura atual

### Branch `main`

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
└── README.md
```

### Branch `dev`

```text
.
├── API.md
├── package.json
├── package-lock.json
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── schemas/
│   └── services/
└── test/
    ├── middleware.test.js
    └── validation.test.js
```

## Pré-requisitos

Para executar o back-end é necessário ter instalado:

- Node.js;
- npm;
- uma instância/projeto Supabase configurado;
- uma chave de API do Gemini para os recursos de IA.

## Instalação

Clone o repositório:

```bash
git clone https://github.com/Anjos-de-Patas/Anjos-de-Patas.git
cd Anjos-de-Patas
```

### Executar a interface

A interface está atualmente na branch `main`.

```bash
git checkout main
```

Abra o arquivo `index.html` no navegador ou utilize uma extensão/servidor local para arquivos estáticos.

Exemplo com VS Code: utilize a extensão **Live Server** e abra o `index.html`.

### Executar o back-end

Mude para a branch `dev`:

```bash
git checkout dev
npm install
```

Crie um arquivo `.env` na raiz da aplicação back-end:

```env
SUPABASE_URL=...
SUPABASE_KEY=...
GEMINI_API_KEY=...
FRONTEND_URL=http://localhost:5173
PORT=3000
```

Inicie em modo de desenvolvimento:

```bash
npm run dev
```

Ou execute normalmente:

```bash
npm start
```

Por padrão, o servidor utiliza a porta `3000`.

## Testes

Na branch `dev`, instale as dependências e execute:

```bash
npm test
```

Os testes atuais verificam partes das validações e middlewares da aplicação.

## API

A documentação das rotas está disponível no arquivo `API.md` da branch `dev`.

Principais endpoints:

```text
GET  /health
POST /api/login
GET  /api/animais
POST /api/animais
PUT  /api/animais/:id
POST /api/busca-inteligente
POST /api/agente
GET  /api/animais/:id/historico
POST /api/adocoes
GET  /api/adocoes
GET  /api/dashboard
```

Rotas administrativas exigem autenticação por token e perfil autorizado.

## Utilização

O público externo poderá utilizar a aplicação para visualizar animais disponíveis para adoção e, conforme a evolução da interface, interagir com o assistente de adoção.

Usuários autorizados da ONG utilizarão as funcionalidades administrativas para cadastrar, atualizar e acompanhar animais, histórico de saúde, resgates, adotantes e adoções.

## Responsividade e acessibilidade

A interface da branch `main` possui regras específicas para desktop, tablet e celular. Também foram incorporados elementos semânticos HTML e atributos ARIA em componentes interativos.

A validação completa de acessibilidade continuará durante os testes e refinamentos da aplicação.

## Documentação acadêmica

O projeto possui o Documento Técnico da TED 1 com diagnóstico da demanda, requisitos e planejamento da solução. A Versão 2.0 acrescenta a documentação da implementação da interface, estrutura da aplicação, decisões arquiteturais, tecnologias efetivamente utilizadas, evidências visuais e histórico de versões.

## Publicação

No momento, ainda não há um endereço público definitivo da aplicação registrado no repositório.

Quando o ambiente de demonstração estiver disponível, o link deverá ser incluído nesta seção e no Documento Técnico do Projeto.

## Repositório

https://github.com/Anjos-de-Patas/Anjos-de-Patas

## Observação

Este repositório faz parte de um projeto acadêmico em desenvolvimento. A estrutura e as funcionalidades poderão ser atualizadas nas próximas etapas da disciplina.
