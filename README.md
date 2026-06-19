# CSHUB - Solicitações de Desenvolvimento

Plataforma interna para o time da CSHUB registrar, acompanhar e gerenciar solicitações de desenvolvimento de software, com fluxo de aprovação, comentários, sugestões, notificações por menção e painel administrativo de usuários e setores.

## Stack

- [Next.js](https://nextjs.org) (App Router, Turbopack)
- [Prisma](https://www.prisma.io) + PostgreSQL (via [Supabase](https://supabase.com))
- [Supabase Auth](https://supabase.com/docs/guides/auth) para autenticação
- Tailwind CSS + [Base UI](https://base-ui.com) para componentes
- Deploy na [Netlify](https://www.netlify.com)

## Começando

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie o arquivo de exemplo de variáveis de ambiente e preencha com as credenciais do Supabase:

   ```bash
   cp .env.example .env.local
   ```

3. Gere o client do Prisma e aplique as migrations:

   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

4. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

5. Acesse [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

Veja [.env.example](.env.example) para a lista completa. Em resumo:

- `DATABASE_URL` / `DIRECT_URL` — conexão com o Postgres do Supabase (pooler de transação e conexão direta para migrations, respectivamente).
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — credenciais públicas do Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` — chave de service role, usada apenas em server actions para criar/editar usuários. Nunca expor no client.
- `SUPABASE_LEGACY_JWT_SECRET` — segredo legado do JWT do Supabase.

## Scripts

- `npm run dev` — inicia o servidor de desenvolvimento.
- `npm run build` — gera a build de produção.
- `npm run start` — inicia o servidor a partir da build de produção.
- `npm run lint` — executa o linter.

## Deploy

O deploy é feito automaticamente pela Netlify a cada push na branch `main`, usando o plugin `@netlify/plugin-nextjs` (configuração em [netlify.toml](netlify.toml)).
