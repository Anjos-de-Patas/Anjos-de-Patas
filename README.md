# Anjos de Patas

Projeto acadêmico desenvolvido na disciplina de **Programação para Web** do curso de **Análise e Desenvolvimento de Sistemas - UNIBALSAS**, em parceria com a Sociedade Protetora dos Animais Anjos de Patas, de Balsas - MA.

## Objetivo

Desenvolver uma aplicação web para apoiar a organização das informações dos animais atendidos pela ONG, facilitar a consulta de animais disponíveis para adoção e oferecer recursos de apoio ao processo de adoção.

## Equipe

| Integrante | Função |
| --- | --- |
| Carinne da Silva Borges | Desenvolvedor Front-end | / UI/UX |
| João Pedro Strasser Santos | Analista de Requisitos / QA |
| Júlio César Lima dos Reis | Banco de Dados / Back-end |
| Rogério Mota de Melo | Desenvolvedor Back-end |

## Situação atual do projeto

O front-end e o back-end estão atualmente integrados na branch `main`.

A aplicação possui uma área pública voltada à consulta de animais e ao apoio ao processo de adoção, além de uma área administrativa protegida por autenticação para usuários autorizados da ONG.

O projeto continua em desenvolvimento. Os módulos administrativos de gerenciamento de animais, resgates, cuidados de saúde, adotantes e adoções estão sendo integrados progressivamente à interface.

## Funcionalidades implementadas

### Área pública

- página inicial da aplicação;
- apresentação institucional da ONG;
- seção de animais disponíveis para adoção;
- filtros combináveis por espécie e sexo;
- visualização de informações dos animais;
- explicação do processo de adoção;
- seção de contato;
- assistente de adoção integrado ao back-end;
- integração do assistente com IA generativa;
- layout responsivo para computadores, tablets e smartphones;
- recursos de acessibilidade em componentes interativos.

### Área administrativa

- autenticação de usuários;
- controle de acesso às rotas administrativas;
- Dashboard administrativo responsivo;
- menu lateral adaptado para desktop e dispositivos móveis;
- exibição dos indicadores gerais do sistema;
- perfil do usuário autenticado;
- consulta de nome, e-mail e função;
- edição do nome do usuário;
- controle de usuários ativos e inativos por perfil;
- encerramento da sessão.

### Back-end e API

O back-end já possui suporte para:

- autenticação;
- listagem, cadastro e atualização de animais;
- cadastro e acompanhamento de adotantes;
- registro de resgates;
- registros de saúde;
- registro de vacinas;
- registro de tratamentos;
- histórico individual dos animais;
- registro e consulta de adoções;
- dados do Dashboard;
- busca inteligente;
- agente de apoio à adoção;
- validação de dados;
- controle de acesso;
- proteção de rotas;
- tratamento centralizado de erros;
- testes automatizados.

> Algumas funcionalidades disponíveis na API ainda estão em processo de integração com a interface administrativa.

## Autenticação e perfis

A autenticação utiliza o **Supabase Auth**.

Os dados internos dos usuários autorizados da ONG são associados à tabela `public.perfis`.

A responsabilidade dos dados está organizada da seguinte forma:

| Informação | Responsável |
| --- | --- |
| Identificação da conta | Supabase Auth |
| E-mail | Supabase Auth |
| Senha | Supabase Auth |
| Sessão e token | Supabase Auth |
| Nome | `public.perfis` |
| Perfil de acesso | `public.perfis` |
| Situação ativo/inativo | `public.perfis` |

Atualmente estão previstos os seguintes perfis:

- `admin`;
- `voluntario`;
- `veterinario`.

A área administrativa não possui cadastro público de usuários.

## Tecnologias utilizadas

### Front-end

- HTML5
- CSS3
- JavaScript

### Back-end e API

- Node.js
- Express

### Banco de dados e autenticação

- Supabase
- PostgreSQL
- Supabase Auth

### Inteligência Artificial

- Google Gemini

### Bibliotecas e recursos de apoio

- Zod — validação de dados;
- Helmet — configuração de cabeçalhos de segurança;
- CORS — controle de acesso entre front-end e API;
- express-rate-limit — limitação de requisições;
- dotenv — gerenciamento de variáveis de ambiente;
- Nodemon — apoio à execução do servidor durante o desenvolvimento.

### Ferramentas de desenvolvimento

- Git
- GitHub
- Figma
- Visual Studio Code

## Estrutura do projeto

```text
.
├── assets/
│   └── icons/
├── css/
│   ├── dashboard.css
│   ├── login.css
│   ├── perfil.css
│   └── style.css
├── js/
│   ├── dashboard.js
│   ├── login.js
│   ├── main.js
│   └── perfil.js
├── pages/
│   ├── dashboard.html
│   ├── login.html
│   └── perfil.html
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── schemas/
│   └── services/
├── test/
├── API.md
├── index.html
├── package.json
├── package-lock.json
└── README.md
```

A estrutura será ampliada conforme as demais telas administrativas forem implementadas.

## Pré-requisitos

Para executar o projeto é necessário ter instalado:

- Node.js;
- npm;
- Visual Studio Code ou outro editor compatível;
- um projeto Supabase configurado;
- uma chave da API Gemini para os recursos de IA.

Para executar a interface durante o desenvolvimento, recomenda-se utilizar um servidor local, como a extensão **Live Server** do Visual Studio Code.

## Instalação

Clone o repositório:

```bash
git clone https://github.com/Anjos-de-Patas/Anjos-de-Patas.git
cd Anjos-de-Patas
```

Instale as dependências:

```bash
npm install
```

## Configuração das variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto.

Exemplo:

```env
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
FRONTEND_URL=http://127.0.0.1:5500
PORT=3000
```

As credenciais reais não devem ser adicionadas ao repositório.

O arquivo `.env` está ignorado pelo Git por meio do `.gitignore`.

A `SUPABASE_SERVICE_ROLE_KEY` é utilizada exclusivamente no ambiente de back-end para operações administrativas autorizadas e não deve ser exposta no código do front-end.

## Executando o back-end

Para iniciar o servidor em modo de desenvolvimento:

```bash
npm run dev
```

Por padrão, o back-end utiliza a porta:

```text
3000
```

O terminal deverá indicar que o servidor está ativo.

## Executando o front-end

Com o back-end em execução, abra o arquivo `index.html` utilizando um servidor local.

No Visual Studio Code, utilizando o **Live Server**:

1. abra o projeto;
2. localize `index.html`;
3. utilize a opção **Open with Live Server**.

No ambiente atual de desenvolvimento, o front-end está configurado para:

```text
http://127.0.0.1:5500
```

A origem utilizada pelo front-end deve corresponder ao valor configurado em `FRONTEND_URL`.

## Utilização

### Área pública

O visitante pode:

- acessar a página inicial;
- conhecer informações sobre a ONG;
- consultar animais apresentados para adoção;
- aplicar filtros;
- visualizar informações dos animais;
- consultar informações sobre o processo de adoção;
- utilizar o assistente para procurar animais compatíveis com suas preferências.

### Área administrativa

Usuários autorizados podem acessar a opção **Entrar** na página inicial.

Após a autenticação, o usuário é direcionado ao Dashboard administrativo.

A área administrativa permite, conforme as funcionalidades já implementadas ou em integração:

- consultar indicadores;
- acessar o próprio perfil;
- atualizar o nome de exibição;
- gerenciar informações relacionadas aos animais e ao processo de adoção.

As funcionalidades disponíveis dependem do perfil de acesso do usuário.

## API

A documentação complementar das rotas está disponível em `API.md`.

Entre os endpoints existentes estão:

```text
GET  /health

POST /api/login

GET  /api/perfil
PUT  /api/perfil

GET  /api/animais
GET  /api/admin/animais
POST /api/animais
PUT  /api/animais/:id

POST /api/busca-inteligente
POST /api/agente

GET  /api/animais/:id/historico
POST /api/animais/:id/resgates
POST /api/animais/:id/saude
POST /api/animais/:id/vacinas
POST /api/animais/:id/tratamentos

POST /api/adotantes
GET  /api/adotantes
PUT  /api/adotantes/:id/status

POST /api/adocoes
GET  /api/adocoes

GET  /api/dashboard
```

As rotas administrativas exigem autenticação por token e perfil autorizado.

## Banco de dados

O banco de dados utiliza PostgreSQL por meio do Supabase.

Entre as principais estruturas atualmente utilizadas estão:

- `animais`;
- `adotantes`;
- `adocoes`;
- `resgates`;
- `registros_saude`;
- `vacinas`;
- `tratamentos`;
- `perfis`.

O Supabase Auth é utilizado separadamente para autenticação das contas administrativas.

## Dados de demonstração

Durante o desenvolvimento acadêmico, são utilizados dados fictícios para permitir testes e demonstrações das funcionalidades enquanto não estão disponíveis todos os dados reais necessários da ONG.

Esses registros têm finalidade de desenvolvimento, validação da interface e demonstração do sistema.

## Assistente de adoção

O projeto possui um assistente integrado ao back-end para apoiar a busca de animais de acordo com as preferências informadas pelo usuário.

O assistente utiliza integração com o Google Gemini e ferramentas internas da aplicação para consultar os dados disponíveis.

O recurso funciona como apoio à busca e não realiza aprovação automática de adoções.

## Testes

Para executar os testes automatizados:

```bash
npm test
```

A suíte atual verifica componentes do back-end, incluindo validações, middlewares e regras de segurança implementadas.

Antes da integração de novas funcionalidades, recomenda-se confirmar que todos os testes continuam passando.

## Responsividade e acessibilidade

A aplicação possui adaptações para:

- computadores;
- tablets;
- smartphones.

Também são utilizados elementos semânticos HTML, atributos ARIA, gerenciamento de foco em componentes interativos e adaptações de navegação para telas menores.

A acessibilidade continuará sendo revisada durante o desenvolvimento.

## Segurança

Entre as medidas adotadas atualmente estão:

- autenticação pelo Supabase Auth;
- validação de token nas rotas protegidas;
- controle de acesso por perfil;
- verificação de usuários ativos;
- validação de dados recebidos pela API;
- Helmet;
- configuração de CORS;
- limitação de requisições em rotas específicas;
- tratamento centralizado de erros;
- variáveis sensíveis armazenadas fora do repositório.

As regras de segurança do banco de dados continuarão sendo revisadas durante a evolução do projeto.

## Documentação acadêmica

O projeto possui o Documento Técnico da TED 1, contendo o diagnóstico da demanda, requisitos e planejamento da solução.

A Versão 2.0 deverá preservar as informações da TED 1 e acrescentar, entre outros elementos:

- estrutura da aplicação;
- documentação da interface;
- decisões arquiteturais tomadas durante a implementação;
- tecnologias efetivamente utilizadas;
- evidências visuais da aplicação;
- histórico atualizado de versões.

## Publicação

No momento, não há um endereço público definitivo da aplicação registrado no repositório.

Quando um ambiente de demonstração for disponibilizado, o endereço deverá ser incluído nesta seção e na documentação acadêmica correspondente.

## Repositório

O projeto é mantido na organização **Anjos-de-Patas** no GitHub, no repositório **Anjos-de-Patas**.

## Observação

Este repositório faz parte de um projeto acadêmico em desenvolvimento.

A estrutura, as funcionalidades e a documentação poderão ser atualizadas conforme o avanço das próximas etapas da disciplina.
