# Pelangi² — Learning Reference

A working reference for the backend learning journey on this project. Update this file as you go; it should evolve with your understanding.

---

## Phase progression

- **Phase 1** — Frontend basket + login modal. **COMPLETE.**
- **Phase 2** — Database + API. **IN PROGRESS** (Step G done, Route Handler next).
- **Phase 3** — Real auth (NextAuth/Auth.js) + persistent cart. Pending.
- **Phase 4** — AI: product recommendations + chatbot. Pending.

---

## Next.js (App Router, Routing, Data Fetching)

**Route Handlers** (the file-based API endpoints we'll use)
- Reference: https://nextjs.org/docs/app/api-reference/file-conventions/route
- Focus on: basic `GET`, returning JSON via `Response.json(...)`, query params via `request.nextUrl.searchParams`, dynamic segments `[id]`.

**Server Components vs Client Components**
- Guide: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Focus on: when each is appropriate, the boundary rule (server can render client, not the other way), the `"use client"` directive.

**Data Fetching**
- Guide: https://nextjs.org/docs/app/getting-started/fetching-data
- Focus on: `fetch` inside Server Components, basic caching behavior. Skip parallel fetching and Suspense for now.

**File-based routing reference**
- https://nextjs.org/docs/app/getting-started/project-structure

---

## Prisma (ORM, Migrations, Seeding)

**Quickstart** (the one we followed)
- SQLite: https://www.prisma.io/docs/getting-started/quickstart-sqlite
- Postgres (for when we switch): https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases-typescript-postgresql

**Schema design**
- Data model overview: https://www.prisma.io/docs/orm/prisma-schema/data-model/models
- Schema attributes (`@id`, `@default`, `@updatedAt`, `@unique`): https://www.prisma.io/docs/orm/prisma-schema/data-model/models#defining-attributes
- Scalar types reference: https://www.prisma.io/docs/orm/reference/prisma-schema-reference#model-field-scalar-types
- Json field caveats: https://www.prisma.io/docs/orm/prisma-schema/data-model/models#json

**Client and singleton**
- Best practice for Next.js (the `globalThis` pattern): https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices

**Migrations**
- Getting started: https://www.prisma.io/docs/orm/prisma-migrate/getting-started
- Anatomy of a migration: https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/mental-model

**Seeding**
- Seed workflow: https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding
- `createMany` reference: https://www.prisma.io/docs/orm/reference/prisma-client-reference#createmany

**Prisma Studio** (the visual DB inspector)
- Docs: https://www.prisma.io/docs/orm/tools/prisma-studio

---

## Validation (Phase 2 Step 4)

**Zod** — schema validation library for input data
- Site: https://zod.dev/
- For now: just understand `z.object({ ... }).parse(data)` vs `.safeParse(data)`.

---

## Authentication (Phase 3)

**Auth.js (formerly NextAuth.js)**
- Site: https://authjs.dev/
- Getting started with Next.js: https://authjs.dev/getting-started/installation

---

## Tools

**`tsx`** — runs TypeScript files without compilation step (we use it for the seed)
- https://www.npmjs.com/package/tsx

**Docker Desktop** (when we move to Postgres locally)
- https://docs.docker.com/desktop/install/windows-install/

---

## Background reading (concepts, not docs)

- **Why floats are bad for money** — https://stackoverflow.com/a/3730040
- **Object identity in JS** (variables hold references, not copies) — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management
- **Hot Module Replacement explained** — https://webpack.js.org/concepts/hot-module-replacement/

---

## Project-specific decisions (the "why")

These are the design choices we made and the reasoning. When in doubt, defer to these.

| Decision | Choice | Why |
|---|---|---|
| Local DB | SQLite | Zero install; switch to Postgres at deploy. Concepts carry over. |
| Product ID | `cuid()` | Collision-resistant, opaque, doesn't leak business info via URL enumeration. |
| Seed IDs | Preserve `"1"`–`"13"` | Existing promotion data references these; keeps Phase 1 logic intact. |
| `sizes` / `images` | `Json` columns | SQLite has no array type; pragmatic shortcut. Schema debt to revisit when adding per-size inventory. |
| `salePrice` | Dropped from Product model | Promotions table is the single source of discount truth. |
| Money type | `Int` (no decimals) | IDR has no fractional units; `Float` is wrong for currency in any case. |
| `category` enum | Yes | Closed, stable, homogeneous set — perfect enum candidate. |
| `size` enum | No | Mixed letter/numeric systems (S/M/L vs 30/32/34); breaks the enum's "homogeneous" rule. |
| Prisma generator | `prisma-client` (new) | Output at `src/generated/prisma`; client imported from `@/generated/prisma/client`. `src/generated/` is gitignored. |
| Client instantiation | Singleton via `globalThis` in dev only | Survives Next.js hot-reload; production doesn't need or want the cache. |

---

## Command cheat sheet

```bash
# Initial setup (done once)
npm install -D prisma tsx
npm install @prisma/client
npx prisma init --datasource-provider sqlite

# Every time you change schema.prisma
npx prisma migrate dev --name <descriptive-name>

# Repopulate the DB with fixture data
npx prisma db seed

# Inspect data visually
npx prisma studio

# Regenerate the client without migrating (rare)
npx prisma generate

# When the DB gets weird in dev — wipe and re-migrate from scratch
npx prisma migrate reset
```

---

## Key concepts in your own words

Fill these in as you learn — write them yourself, in your own words. Don't paste; rephrasing is how it sticks.

- **What is a Route Handler?** _(your answer)_
- **What's the difference between a Server Component and a Client Component?** _(your answer)_
- **Why does the Prisma singleton need `globalThis`?** Survives Next.js hot-reload module re-evaluation; without it, every save creates a new PrismaClient and exhausts DB connections.
- **Why only cache in development?** Production doesn't hot-reload; the cache solves no problem there and could leak state in serverless environments.
- **Why `Int` for money?** Floating-point binary representation can't exactly represent decimals like 0.1, leading to rounding errors that compound over many calculations.
- **Why was sizes a bad enum candidate?** Letter sizes (S, M, L, XL) and numeric pant sizes (30, 32, 34) aren't homogeneous — they're different measurement systems coexisting in the same field. Enums work best when the set is closed, stable, AND homogeneous.

---

## Open questions for next session

- **Server Component or client `useEffect` for the product fetch?** Form a position before we start writing the Route Handler. Read https://nextjs.org/docs/app/getting-started/server-and-client-components first.

---

## When you forget what you learned

The reading list is a quick refresher. But if a concept stops making sense, the fix is usually to **re-read the migration SQL** (`prisma/migrations/*/migration.sql`) — that file is ground truth, regardless of what the ORM is doing on top.
