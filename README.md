# BiblioFlix — Biblioteca Digital

Sistema de biblioteca com catálogo de livros, empréstimos com QR Code e painel
administrativo. Agora com **banco de dados PostgreSQL** de verdade, **login com
senha** e **cadastro/baixa de livros** pelos administradores.

O banco vem **vazio** — você cria o primeiro admin com um comando e adiciona os
livros e usuários pelo próprio site.

---

## 1. O que o sistema faz

- **Visitantes**: navegam pelo catálogo e na página inicial.
- **Leitores** (criam conta sozinhos): fazem login, pegam livros emprestados
  (gera QR Code) e veem/devolvem seus empréstimos.
- **Bibliotecários**: tudo do leitor + cadastram/editam/excluem livros e dão
  **baixa** (registram a devolução) de qualquer empréstimo.
- **Administradores**: tudo do bibliotecário + criam e excluem usuários
  (inclusive outros admins e bibliotecários).

Recursos do painel administrativo:

- **Escanear pelo celular** (Painel Admin → Escanear): lê o **código de barras
  (ISBN)** ou o **QR** do livro pela câmera para registrar empréstimo, dar baixa
  (devolução) ou cadastrar um livro novo. Ao cadastrar por ISBN, os dados podem
  ser preenchidos automaticamente (via Open Library). A câmera exige **HTTPS** —
  funciona no site publicado na Vercel (e em `localhost`), mas não em `http://`
  por IP de rede.
- **Etiquetas QR**: o sistema gera um QR por livro para imprimir e colar no
  exemplar (na tela de Escanear).
- **Upload de foto da capa**: ao cadastrar/editar um livro é possível **enviar
  uma foto** (a imagem é reduzida no próprio navegador) ou colar uma URL.
- **Categorias editáveis** (Painel Admin → Categorias): criar, renomear (ajusta
  os livros automaticamente) e excluir categorias.

A \"baixa do livro\" (devolução) também fica em **Painel Admin → Gerenciar
Empréstimos**, no botão **Devolver**. O cadastro de livros fica em **Painel
Admin → Gerenciar Livros**.

---

## 2. Como funciona por dentro (resumo)

- **Next.js 16** (React 19) — telas e também as rotas de API (`app/api/...`).
- **PostgreSQL** — banco de dados.
- **Prisma** — a "ponte" entre o código e o banco. O arquivo
  `prisma/schema.prisma` descreve as tabelas (`User`, `Book`, `Loan`).
- **Autenticação** — senha guardada com hash (bcrypt) e sessão num cookie
  seguro (JWT). Nenhuma senha é salva em texto puro.

```
app/api/        -> as rotas do back-end (login, livros, empréstimos, usuários)
contexts/       -> estado do front-end, que conversa com as rotas de API
lib/prisma.ts   -> conexão com o banco
lib/auth.ts     -> senha + sessão
prisma/         -> o desenho do banco de dados
scripts/        -> criação do primeiro admin
```

---

## 3. Pré-requisitos

- **Node.js 20.9 ou superior** — https://nodejs.org (baixe a versão LTS).
  Confira com: `node -v`
- **Um banco PostgreSQL**. Escolha **uma** das opções abaixo.

### Opção A (mais fácil): PostgreSQL na nuvem com Neon — grátis, sem instalar nada

1. Crie uma conta em https://neon.tech
2. Crie um projeto. Ele já cria um banco para você.
3. Copie a **connection string** (algo como
   `postgresql://usuario:senha@ep-xxx.neon.tech/neondb?sslmode=require`).
   Você vai colar isso no `.env` no próximo passo.

### Opção B: PostgreSQL instalado na sua máquina

1. Instale o PostgreSQL: https://www.postgresql.org/download/
2. Crie um banco chamado `biblioteca`. No terminal:
   ```bash
   createdb biblioteca
   ```
   (ou use o pgAdmin). A connection string será parecida com:
   `postgresql://postgres:SUA_SENHA@localhost:5432/biblioteca?schema=public`

---

## 4. Rodando o projeto (passo a passo)

Abra o terminal **dentro da pasta do projeto** e siga na ordem.

### Passo 1 — Instalar as dependências

```bash
npm install
```

> Isso também cria um `package-lock.json` e gera o cliente do Prisma
> automaticamente (graças ao script `postinstall`).

### Passo 2 — Criar o arquivo de configuração `.env`

Copie o exemplo e edite:

```bash
cp .env.example .env
```

Abra o `.env` e preencha:

- `DATABASE_URL` → a connection string do Passo 3 (Neon ou local).
- `AUTH_SECRET` → um valor aleatório longo. Gere um assim:

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

  Cole o resultado entre as aspas do `AUTH_SECRET`.

### Passo 3 — Criar as tabelas no banco

```bash
npm run db:push
```

Isso lê o `prisma/schema.prisma` e cria as tabelas no seu PostgreSQL. O banco
fica **vazio** (sem nenhum livro ou usuário) — exatamente como você pediu.

> Alternativa para quem quer histórico de migrações versionado no git:
> `npm run db:migrate` (vai pedir um nome, digite por exemplo `init`).

### Passo 4 — Criar o primeiro administrador

```bash
npm run create-admin
```

Ele vai perguntar **nome**, **email** e **senha**. Esse será seu login de admin.
(Pode rodar de novo depois para criar/promover outros admins.)

### Passo 5 — Rodar o site

```bash
npm run dev
```

Abra **http://localhost:3000**. Clique em **Entrar**, use o email e senha do
admin que você criou. Pronto: agora você pode cadastrar livros e gerenciar tudo.

### Bônus — Ver e editar o banco visualmente

```bash
npm run db:studio
```

Abre o **Prisma Studio** no navegador, uma planilha visual das suas tabelas.

---

## 5. Como usar o sistema

- **Cadastrar um livro**: Painel Admin → Gerenciar Livros → *Adicionar Livro*.
  Preencha título, autor, gênero, ISBN, capa (URL de uma imagem), nº de cópias
  etc.
- **Criar usuários** (leitor, bibliotecário, admin): Painel Admin →
  Gerenciar Usuários → *Adicionar Usuário*. Defina nome, email, senha e função.
- **Leitor pegar um livro**: na home ou no catálogo, clique no livro →
  *Realizar Empréstimo*. Aparece o QR Code do empréstimo.
- **Dar baixa (devolução)**: Painel Admin → Gerenciar Empréstimos → botão
  *Devolver*. A cópia volta ao acervo automaticamente.

---

## 6. Subir o projeto no GitHub

> ⚠️ **Nunca suba o arquivo `.env`** (ele tem segredos). O `.gitignore` já está
> configurado para ignorá-lo — não o remova de lá.

1. Crie um repositório **vazio** no GitHub (sem README), e copie a URL dele.
2. No terminal, dentro da pasta do projeto:

   ```bash
   git init
   git add .
   git commit -m "Biblioteca com PostgreSQL, login e painel admin"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```

3. Confira no GitHub que o `.env` **não** apareceu na lista de arquivos. Deve
   aparecer apenas o `.env.example`.

---

## 7. (Opcional) Publicar online na Vercel

1. Em https://vercel.com, importe o repositório do GitHub.
2. Em **Settings → Environment Variables**, adicione:
   - `DATABASE_URL` (use um banco na nuvem, como o Neon do Passo 3 — bancos
     `localhost` não funcionam na nuvem).
   - `AUTH_SECRET` (o mesmo valor aleatório, ou gere outro).
3. Em **Settings → Build & Development**, defina o *Build Command* como:
   ```
   prisma db push && next build
   ```
   (isso garante que as tabelas existam no banco de produção antes do build).
4. Faça o deploy. Depois, rode `npm run create-admin` apontando o `.env` para o
   banco de produção (ou crie o admin localmente conectado a esse mesmo banco).

---

## 8. Problemas comuns

- **"AUTH_SECRET não definido"** → você esqueceu de preencher o `.env`
  (ou de copiá-lo a partir do `.env.example`).
- **Erro de conexão com o banco** → confira a `DATABASE_URL`. No Neon, ela
  precisa terminar com `?sslmode=require`.
- **`node --env-file` não reconhecido** → sua versão do Node é antiga.
  Atualize para Node 20.9+.
- **Não aparece nenhum livro** → é esperado! O banco começa vazio. Faça login
  como admin e cadastre os primeiros livros.
- **Esqueci a senha do admin** → rode `npm run create-admin` de novo com o mesmo
  email; ele atualiza a senha.

Bom proveito! 📚
