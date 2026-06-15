# Pelangi² — Learning Reference

A working reference for the backend learning journey on this project. Update this file as you go; it should evolve with your understanding.

---

## Phase progression

- **Phase 1** — Frontend basket + login modal. **COMPLETE.**
- **Phase 2** — Database + API. **COMPLETE.**
- **Phase 3** — Cookie-based auth (custom, not NextAuth) + dual-identifier (email OR phone). **IN PROGRESS** as of 2026-06-15.
- **Phase 4** — Orders / transactions. Pending.
- **Phase 5** — AI: product recommendations + chatbot. OTP for phone auth. Pending.

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

# Phase 3 — Backend Integration Lessons (2026-06-15)

This section captures the patterns, gotchas, and mental models from the Phase 3 session — wiring the frontend to a real cookie-based authentication backend with dual identifier support (email OR phone).

## 1. The AuthContext as a State Mutator

### Three responsibilities

A real AuthContext does three things, no more:

- **Hydrate**: on mount, ask the server "who am I?" via `GET /api/auth/me`. The session cookie is `httpOnly` so JavaScript cannot read it directly. This endpoint bridges that gap.
- **Mutate**: `login` / `register` / `logout` call POST endpoints and update React state from the response.
- **Expose**: provide a `useAuth` hook so any component can read `user`, open the modal, log out.

### The setState commitment pattern

Every successful operation has two halves: the network call AND the React state change. If you forget the state change, the API says "you are logged in" but the UI doesn't know.

For each success path, list what state must change:

| Operation success | What state changes |
|---|---|
| Hydration | `user` |
| Login | `user`, `isModalOpen` |
| Register | `user`, `isModalOpen` |
| Logout | `user` (set to null) |

This was the single most common mistake of the session: returning `{ ok: true }` from login without calling `setUser(data.user)`. The fix is mechanical — add the setter call before the return.

### Discriminated unions for Result types

Login failure (wrong password) is a *normal user flow*, not an exception. Throwing forces every caller to wrap in try/catch. A discriminated union is explicit:

```ts
type AuthResult = { ok: true; data: User } | { ok: false; error: string };
```

Callers narrow with `if (result.ok)` and TypeScript knows `error` only exists on the failure branch. Returns instead of throws make control flow visible.

### isLoading semantics — pick ONE meaning

Two valid patterns:

- **Pattern A (recommended)**: `isLoading` represents *only* hydration. It starts `true`, flips to `false` after /me resolves, and stays `false` forever. Modal handles its own `submitting` state locally.
- **Pattern B**: every fetch toggles `isLoading`. Causes Navbar skeleton flicker on every auth action.

Pick Pattern A. The skeleton should flash for hydration only, not on every login/logout button click.

### Hydration via useEffect

The cookie outlives React state. Every refresh, React state resets to `user = null`, but the session cookie still works. On mount:

```ts
useEffect(() => {
  fetch("/api/auth/me", { credentials: "include" })
    .then((r) => r.json())
    .then((data) => setUser(data.user))
    .catch(() => setUser(null))
    .finally(() => setIsLoading(false));
}, []);
```

**Empty deps `[]` is critical.** Putting `user` in there creates an infinite fetch loop.

### Better alternative: server-side initialUser

The useEffect pattern is universal. In Next.js App Router there is a cleaner option: the root layout (Server Component) calls `getSession()` directly, no network roundtrip, no flicker. Pass `initialUser` as a prop to AuthProvider. Use this when graduating from the universal pattern to the Next.js-native one.

---

## 2. Cookie-Based Authentication

### httpOnly is a security feature

The session cookie is set with `httpOnly: true`. JavaScript *cannot read or write it*. This prevents XSS attacks from stealing tokens. The only way to know if a session exists is to ask the server. The only way to change the cookie is for the server to send a `Set-Cookie` response header.

### credentials: "include" — the most common bug

Without this option, the browser silently refuses to store the `Set-Cookie` from the response. Symptoms: login returns 200 with user data, but the next `/me` returns `{ user: null }`.

```ts
fetch("/api/auth/login", {
  method: "POST",
  credentials: "include",   // ← without this, Set-Cookie is ignored
  ...
});
```

### No HTTP method called "UPDATE"

Valid methods: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS. "UPDATE" is a *semantic word* that does not exist on the wire. For logout: POST is conventional; DELETE is arguably more semantic.

### What logout actually does

A five-step server-side process. The client only controls steps 1 and 5:

1. **Client** sends `POST /api/auth/logout` with `credentials: "include"`
2. Server reads `session_id` from the cookie
3. Server deletes the matching Session row
4. Server responds with `Set-Cookie: session_id=; Max-Age=0`
5. **Client** calls `setUser(null)` so React state matches reality

Even if the server call fails, the client should clear `user`. Better to re-log in than to have a half-logged-out UI.

---

## 3. The Server/Client Boundary in Next.js App Router

### Two environments, different rules

- **Server Components**: Node.js. Have `cookies()`, `prisma`, `bcrypt`.
- **Client Components** (`"use client"`): Browser. No Node APIs.

A `"use client"` module runs in the browser. Anything it imports runs in the browser too — **transitively**. This is the trap.

### The bundler does not selectively import

Even if `AuthContext` uses only `classifyIdentifier` from `lib/auth.ts`, the bundler pulls `getSession`, `setSessionCookie`, `bcrypt`, and `cookies()` along with it. The client bundle blows up because `next/headers` is not allowed.

### Fix: split files by environment

| File | Imports allowed | Purpose |
|---|---|---|
| `lib/auth.ts` | `next/headers`, prisma, bcrypt | Server-only |
| `lib/identifier.ts` | Pure JS only | Isomorphic — safe everywhere |

The rule: anything reachable from a `"use client"` boundary must not import server-only APIs.

### The `server-only` package — belt and suspenders

```bash
npm install server-only
```

Then at the top of `lib/auth.ts`:

```ts
import "server-only";
```

If a Client Component ever imports this (directly or transitively), the build fails with a clear error.

---

## 4. Dual Identifier Authentication (Email OR Phone)

### The "identifier" pattern

Indonesian users overwhelmingly prefer phone-based authentication. Cleanest design:

- Server takes `{ identifier: string, password: string }`
- Server classifies: contains `"@"` → email; phone format → phone; otherwise → invalid
- Server normalizes phones to E.164 (`+62...`) before lookup
- One API endpoint, one form field. No email/phone tabs.

### Architectural cost

Three layers change:

- **DB**: `email` becomes optional+unique, `phone` becomes unique. Migration required.
- **API**: register accepts `{ email?, phone?, password, name }` with zod `.refine()` requiring at least one. Login accepts `{ identifier, password }`.
- **Form**: one identifier input, one password input. Login/Register mode tabs.

### E.164 phone normalization

Indonesian numbers come in three forms users will type: `0812-3456-7890`, `+62 812 3456 7890`, `081234567890`. Pick a canonical form (`+62...` no spaces, no dashes) and normalize on EVERY write AND lookup.

```ts
export function normalizePhone(input: string): string | null {
  const cleaned = input.replace(/[^\d+]/g, "");
  let candidate: string;
  if (cleaned.startsWith("+62")) candidate = cleaned;
  else if (cleaned.startsWith("62")) candidate = "+" + cleaned;
  else if (cleaned.startsWith("0")) candidate = "+62" + cleaned.slice(1);
  else return null;
  if (!/^\+62[1-9]\d{7,11}$/.test(candidate)) return null;
  return candidate;
}
```

### Single source of truth

Normalize on the server only. If you normalize in two places, the moment one drifts, lookups silently miss.

### Anti-enumeration — generic 401

All four failure cases (invalid format, no user, wrong password, expired session) return the same generic 401:

```ts
{ error: "Email/nomor telepon atau password salah" }
```

Telling the attacker which check failed enables enumeration of registered users.

### Phone+password is riskier than phone+OTP

Indonesian carriers recycle numbers. SIM swap attacks are easier than email takeovers. For production, phone-based auth should use OTP verification (SMS code). For MVP, phone+password matches what Tokopedia did for years before adding OTP. Plan for OTP in Phase 5.

---

## 5. Common Mistakes — internalize these

1. **Returning `{ ok: true }` without setUser** — context's job is state mutation; callers should not have to manually update.
2. **Returning the wrapper, not unwrapping** — API returns `{ user: {...} }`; AuthResult.data is `User`. Write `data: data.user`.
3. **Adding `name` parameter to login** — login only needs `{ identifier, password }`. Name is for register.
4. **Copy-paste error strings** — "login failed" inside register is a tell. Match the message to the operation.
5. **Toggling isLoading on every operation** — causes Navbar flicker.
6. **Forgetting credentials: "include"** — Set-Cookie silently ignored; auth looks broken but isn't.
7. **Inventing HTTP methods** — there is no "UPDATE".
8. **Importing server-only code from a Client Component** — split lib/auth.ts into server + isomorphic files.
9. **Treating phone+password as secure as email+password** — phone is recyclable; SIM swap is real.

---

## 6. Pattern Library — the shapes to remember

### The canonical JSON POST

```ts
const response = await fetch("/api/something", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify(payload),
});
const data = await response.json();   // parse unconditionally
if (!response.ok) {
  return { ok: false, error: data.error ?? "Request failed" };
}
return { ok: true, data: data };
```

### DTO discipline at the API boundary

```ts
return Response.json(
  { user: { id: user.id, email: user.email, name: user.name } },
  { status: 200 }
);
```

Hand-pick every field. Never spread `{...user}` — that ships `passwordHash`.

### zod refine for cross-field rules

```ts
const RegisterSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(8),
    name: z.string().min(1),
  })
  .refine((data) => !!data.email || !!data.phone, {
    message: "Email atau No. Telepon wajib diisi",
  });
```

### Prisma transaction for related writes

```ts
const { user, session } = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { email, phone, passwordHash, name } });
  const session = await tx.session.create({
    data: { userId: user.id, expiresAt: new Date(Date.now() + 86400_000) },
  });
  return { user, session };
});
```

If session creation fails, user creation rolls back. Otherwise you could have orphaned users with no session.

### The server-only / isomorphic split

```
lib/
  auth.ts          ← "import 'server-only'" — cookies, prisma, bcrypt
  identifier.ts    ← pure helpers — normalizePhone, classifyIdentifier
```

Client Components import from `identifier.ts` only.

---

## 7. Auth Debug Playbook

When the auth loop misbehaves, the symptom rarely tells you the cause. Use this table to start from the symptom and reach the actual bug fast.

| Symptom | Likely cause | What to check |
|---|---|---|
| `POST /api/auth/login 400` in <10ms | Request body shape wrong — zod rejected before DB lookup | DevTools → Network → Payload tab. Compare to what zod expects. |
| `POST /api/auth/login 401` immediately | API is fine; credentials don't match a row | Try the same email/phone via Prisma Studio — does the row exist? |
| Login returns 200 but `/me` returns `{user:null}` next call | Missing `credentials: "include"` on fetch | Verify the option on EVERY auth fetch (login, register, logout, me). |
| Navbar flashes "Masuk" then "Halo, Dandi" on every reload | No `isLoading` skeleton in Navbar | Read `isLoading` from useAuth, render skeleton while true. |
| Navbar flickers during login or logout | Pattern B isLoading — every fetch toggles it | Move `setIsLoading(false)` to the hydration useEffect's `.finally()` only. |
| Phone login fails even though same number works for register | Server is querying `phone = "0812..."` but stored as `"+62812..."` | Both sides must normalize. Server should call `normalizePhone()` before `findUnique`. |
| Module not found: `next/headers` in client component | Server-only code reached via transitive import | Split lib/auth.ts. Move pure helpers to lib/identifier.ts. Add `import "server-only"` to lib/auth.ts. |
| TypeScript: missing 3rd argument to login | login signature still requires `name` | Drop `name` from both the type and the function signature. Login only needs identifier + password. |
| Modal stays open after successful login | Forgot `setIsModalOpen(false)` in the login function | Add it after `setUser(data.user)`, before `return { ok: true }`. |
| `result.data.id` is undefined after login | Returning the wrapper, not the user | Change `return { ok: true, data: data }` → `data: data.user`. |
| Refresh logs me out even though cookie should be valid | No `/me` hydration useEffect | Add the empty-deps useEffect that calls `/me` on mount. |
| Register two users with "the same" phone | No server-side phone normalization | Always `normalizePhone()` before write AND lookup. Pick canonical form once. |
| Browser refuses cookie even with `credentials: "include"` | Cookie has wrong `sameSite`, `secure`, or `domain` | Check `setSessionCookie` flags. Dev needs `secure: false`, prod needs `secure: true`. |

When you genuinely don't know what's broken, **walk down the table top-to-bottom** until a symptom matches.

---

## 8. Phase 3 Concepts in Your Own Words

The exercise: write each answer in your own words, rephrased — not copied. Rephrasing is how it sticks.

- **What does `credentials: "include"` actually do?** _(your answer)_
- **Why is the session cookie httpOnly?** _(your answer)_
- **What's the difference between a `Result` type and throwing?** _(your answer)_
- **Why does the server normalize phone numbers, but not the client?** _(your answer)_
- **What does "anti-enumeration" mean and why does login return the same 401 for "no user" and "wrong password"?** _(your answer)_
- **Why does importing `classifyIdentifier` from lib/auth.ts crash the browser?** _(your answer)_
- **What does `setIsModalOpen(false)` inside login() represent in the broader auth design?** _(your answer)_
- **If your phone-as-username MVP works, why is OTP still a Phase 5 priority?** _(your answer)_

Treat these like flashcards. If you can't answer one without re-reading the section, you don't have it yet.

---

## 9. Phase 4 Preparation Checklist

Before starting orders/transactions, the following must be true:

- [ ] Register with email works end-to-end (DB row, cookie, navbar shows name)
- [ ] Register with phone works end-to-end (in both `0812...` and `+62...` input formats — both resolve to same stored value)
- [ ] Login with the registered email/phone works
- [ ] Logout clears cookie AND React state
- [ ] Refresh after login preserves the session
- [ ] Wrong password shows generic "salah" error, not a specific one
- [ ] Re-register with same email shows 409 / generic conflict
- [ ] `lib/auth.ts` has `import "server-only"` at the top
- [ ] `lib/identifier.ts` is the only place `classifyIdentifier` and `normalizePhone` live
- [ ] No `next/headers` import errors in dev console
- [ ] Navbar shows skeleton during initial hydration (not flickering)

When all 11 are checked, Phase 4 is unblocked.

### What Phase 4 will introduce

- **Order and OrderItem Prisma models** — money fields as Int (cents, but IDR has no cents so just rupiah). Status enum.
- **POST /api/orders endpoint** — auth-guarded. **The server re-fetches product prices** from the DB; never trust client price. The basket item snapshots are a UX detail; the order total is the server's word.
- **Auth middleware pattern** — a helper that 401s if `getSession()` returns null. Used at the top of every protected route handler.
- **CartDrawer wires to /api/orders** — POST the items, get an order ID back, redirect to `/orders/[id]`.
- **/orders/[id] page** — server component that fetches the order, hand-picks fields, shows confirmation.

The same patterns from Phase 3 apply: DTO discipline, transactions for related writes, Result types if exposing to the client, no client-side calculations for money.

---

## 10. Quick Reference Card

A one-pager you can keep open while coding Phase 3/4 work.

### Fetch with cookies

```ts
fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify(payload),
});
```

### Hand-pick DTOs at the API boundary

```ts
return Response.json(
  { user: { id, email, phone, name } },   // NEVER {...user}
  { status: 200 }
);
```

### Result narrowing on the caller

```ts
const result = await login(identifier, password);
if (!result.ok) {
  setServerError(result.error);
  return;
}
// here, result is { ok: true; data: User } — type-narrowed
```

### Generic 401 for anti-enumeration

```ts
const GENERIC_FAIL = Response.json(
  { error: "Email/nomor telepon atau password salah" },
  { status: 401 }
);
if (!user) return GENERIC_FAIL;
if (!isValid) return GENERIC_FAIL;
```

### zod refine for cross-field rules

```ts
.refine((data) => !!data.email || !!data.phone, {
  message: "Email atau No. Telepon wajib diisi",
});
```

### Prisma transaction

```ts
await prisma.$transaction(async (tx) => {
  await tx.user.create({...});
  await tx.session.create({...});
});
```

### Server-only guard

```ts
// First line of lib/auth.ts
import "server-only";
```

### Empty-deps hydration useEffect

```ts
useEffect(() => {
  fetch("/api/auth/me", { credentials: "include" })
    .then(r => r.json())
    .then(data => setUser(data.user))
    .catch(() => setUser(null))
    .finally(() => setIsLoading(false));
}, []);
```

---

## 11. Sources Consulted

- Next.js App Router docs (Server Components, server-only)
- React docs (useEffect, useState, discriminated unions)
- Prisma ORM docs (transactions, optional uniqueness)
- zod docs (refine, safeParse, flatten)
- MDN (HTTP methods, fetch credentials, autocomplete attribute, Set-Cookie)
- OWASP Authentication Cheat Sheet (anti-enumeration)
- E.164 phone number standard (ITU-T)
- Auth0 documentation (passwordless and identifier-based login)

---

## When you forget what you learned

The reading list is a quick refresher. But if a concept stops making sense, the fix is usually to **re-read the migration SQL** (`prisma/migrations/*/migration.sql`) — that file is ground truth, regardless of what the ORM is doing on top.

For Phase 3 specifically: the **Auth Debug Playbook** above is the fastest path from symptom to fix. If a new auth bug appears later that isn't in the table, add it — the table only stays useful if you grow it.
