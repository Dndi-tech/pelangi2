# Pelangi² — Backend Engineering Study Guide

A practical learning reference for the work done across Phase 1 (frontend state), Phase 2 (database + API), and Phase 3 (authentication). Written for engineers early in their career — explanations come before code, principles are stated explicitly, and common mistakes are called out.

---

## Table of contents

1. [How to use this guide](#how-to-use-this-guide)
2. [Foundational principles](#foundational-principles)
3. [Phase 1 — Frontend state management](#phase-1--frontend-state-management)
4. [Phase 2 — Database and API layer](#phase-2--database-and-api-layer)
5. [Phase 3 — Authentication](#phase-3--authentication)
6. [Debugging skills](#debugging-skills)
7. [Engineering habits worth keeping](#engineering-habits-worth-keeping)
8. [Glossary](#glossary)
9. [Self-test questions](#self-test-questions)

---

## How to use this guide

Read it in order, once, slowly. Then return to specific sections when you're stuck on something during real work. The "foundational principles" section is the most important — it covers ideas that show up in every phase. The phase sections show how those principles apply to concrete problems.

**Read the explanations, not just the code blocks.** The code is illustration; the explanations are the actual lesson.

---

## Foundational principles

These ideas appeared in every part of the project. Internalizing them means you can navigate code in any framework or stack — not just the one we used.

### 1. Folder structure is the source of truth

In Next.js App Router, the folder layout under `src/app/` directly defines what URLs exist. Add a folder named `cart` → the URL `/cart` exists. Add `route.ts` inside an `api/` subtree → that path becomes an API endpoint.

This is "convention over configuration": instead of writing a router config file that maps URLs to handlers, the location of your files *is* the configuration. The advantage is that someone who knows the convention can read your codebase by file name alone. The disadvantage is that you must follow the convention exactly.

**Key principle:** when a framework uses convention over configuration, fighting the convention costs more than it saves. Don't rename folders to be cute or "more readable" if the convention dictates a specific name. Future readers will look in the conventional place.

### 2. The bottom-up rule for refactoring

When you change a system that has layers (database → API → state management → UI), always change the bottom layer first and work upward. Don't change the UI before the API exists. Don't change the API before the database can support it.

The reason: each layer depends on the one below it. If you start at the top, you're calling functions that don't exist yet or have the wrong shape, and every error sounds like a syntax error when really it's a sequencing error.

We violated this rule once during Phase 3, when we tried to refactor the LoginModal before the AuthContext was refactored, before the API endpoints existed. The result was unsalvageable confusion until we reverted and went bottom-up.

**Key principle:** databases first, helpers second, endpoints third, state management fourth, UI last. Every layer is fully working before the next one starts.

### 3. Store the minimum data you need

The fewer fields you store, the fewer ways a data leak can hurt your users. This drove several decisions:

- Password hashes instead of encrypted passwords (we'll explain why in detail later)
- Returning only `id`, `email`, `name` from auth endpoints — never the full user row
- Not returning `passwordHash` to the client even though it's irreversible

The same principle applies in reverse: don't store what you don't need. If a field has no clear use case, don't add it "in case we need it later."

### 4. Validate at every boundary

A boundary is a point where data crosses from a less-trusted zone to a more-trusted zone. Common boundaries:

- HTTP request → your server
- Server → database
- External API → your code
- User input → form

At every boundary, validate the data shape. We did this with Zod on the auth endpoints:

```ts
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const parsed = RegisterSchema.safeParse(body);
if (!parsed.success) {
  return Response.json({ error: parsed.error.flatten() }, { status: 400 });
}
```

The validation does two jobs: rejects malformed requests with a clear error, and gives TypeScript an exact, typed shape for the rest of the handler.

**Key principle:** never trust input. Validate at the door, then operate on validated data with confidence.

### 5. Single source of truth

When the same fact lives in multiple places, those places will eventually disagree. Examples we encountered:

- `salePrice` on a Product table AND a `Promotion` table — both claim to know if something is on sale. We removed `salePrice` and made the Promotion table the only source.
- Two implementations of `cookies.set(...)` in two route files. We extracted into `setSessionCookie()` so one function is the truth.
- The fake AuthContext "logged in" state vs the real session in the database. Until refactored, these can diverge — the in-memory state says you're logged in, but the cookie has expired.

**Key principle:** if you find yourself updating the same value in two places, extract it into one place. The right time to deduplicate is the second time you write the same code.

### 6. Naming reveals intent

Bad names cause bugs. Examples we hit:

- `Prisma` (uppercase) vs `prisma` (lowercase). Uppercase is the type namespace; lowercase is the client instance. Mixing them up causes errors that the type system can sometimes catch and sometimes can't.
- `password` vs `passwordHash`. The first invites accidents ("just compare them with `===`"); the second makes the correct usage obvious.
- `session` vs `cookieStore`. We named the cookie store `session` once, which collided conceptually with the "session" from the database. Bad name caused confusion.

**Key principle:** names are documentation. Pick names that make the intended use obvious and the wrong use awkward.

### 7. Pure functions and side effects

A pure function takes inputs and returns outputs without affecting the outside world. A side effect is anything that touches the outside world: writing to a database, reading a file, calling an API, mutating a shared variable.

Pure functions are easy to test (call them with inputs, check outputs) and easy to reason about. Side effects are harder. Push side effects to the edges of your system; keep the middle pure where you can.

Our `toViewModel` mapper function in `product.tsx` is pure. Our route handlers contain side effects (DB queries, cookie writes). The validation logic with Zod is pure. The reducer in `BasketContext` is pure (it returns a new state, doesn't mutate the old one).

---

## Phase 1 — Frontend state management

### What we built

A Next.js shop frontend with:
- An `AuthContext` for tracking who's logged in
- A `BasketContext` for the shopping cart (with `localStorage` persistence)
- A `LoginModal` component
- A `CartDrawer` slide-out panel
- Product cards that gate adding to cart on being logged in

### React Context — what it is and when to use it

React Context lets you share data with components deep in the tree without passing it through props at every level. You wrap your tree in a `Provider` and any descendant can call a hook to read the shared data.

```tsx
const ctx = createContext<MyState | null>(null);

function MyProvider({ children }) {
  const [state, setState] = useState(...);
  return <ctx.Provider value={state}>{children}</ctx.Provider>;
}

function MyChild() {
  const state = useContext(ctx);
  return <div>{state.user.name}</div>;
}
```

When to use it: state that several distant components need (auth, theme, language, shopping cart). When not to use it: state that only one component or its immediate children need — pass props instead.

### Why providers wrap at the root layout

The provider must be **above** every component that uses it in the tree. If we wrapped just `<main>` in providers but our `LoginModal` is at the same level as `<main>` (a sibling, not a child), then `LoginModal` is outside the provider tree and `useAuth()` throws.

Lesson: provide at the highest point where everyone who needs it lives below.

There's a second reason for root-level: Next.js's App Router keeps `layout.tsx` mounted across route changes. State in a provider inside `layout.tsx` persists when the user navigates between pages. If you put the provider inside `page.tsx`, navigating away resets it.

### Server Components vs Client Components

In Next.js App Router, every component is a "Server Component" by default — it runs only on the server, produces HTML, and ships **no JavaScript to the browser for that component**.

If a component needs interactivity (state, effects, browser-only APIs, hooks like `useState`), it must be marked with `"use client"` at the top of the file. That makes it a "Client Component" — it ships JavaScript to the browser and re-renders on state changes.

The rule: **Server Components can render Client Components as children, but Client Components cannot import Server Components.** The boundary flows one way — server to client.

Why this matters for performance: Server Components mean less JS shipped. A 20-page marketing site that's 100% Server Components ships almost no JS — your homepage loads in milliseconds. Interactive parts (cart button, login form) are "client islands" surrounded by server-rendered shells.

For our product listing, we used this pattern:
- `product.tsx` is a Server Component — runs on the server, queries Prisma, passes data down
- `productGrid.tsx` is a Client Component — owns the "show more" toggle state and the cart-add logic

The header markup (title, decorative bits) stayed on the server. Only the truly interactive part became client-side.

**Key principle:** push the `"use client"` boundary as deep into the tree as possible. The leaves are interactive; the trunk and branches don't need to be.

### useState vs useReducer

`useState` is fine for independent state values:

```ts
const [open, setOpen] = useState(false);
const [name, setName] = useState("");
```

`useReducer` is better when multiple state values change together based on action types:

```ts
const [state, dispatch] = useReducer(reducer, { items: [] });
dispatch({ type: "ADD", payload: ... });
dispatch({ type: "REMOVE", payload: ... });
```

We used `useReducer` for the basket because cart operations (add, remove, update quantity, clear) are interrelated and benefit from being expressed as a single state machine. The reducer is a pure function — given a state and an action, return the new state. Easy to test, easy to extend.

### localStorage persistence with SSR safety

When you persist state to `localStorage`, you can't read it during server-side rendering because `localStorage` doesn't exist on the server. The standard pattern:

1. Initialize state with an empty/default value
2. Read from `localStorage` in a `useEffect` after mount
3. Write to `localStorage` on every state change (after hydration)

The tricky part: if you write on every state change starting from mount, your first write happens before the read finishes, and you overwrite the saved data with the empty default. We solved this with a render counter that skips the first persistence pass.

There's a brief "flash of empty cart" on first load that we accept as the cost of SSR safety. The alternative (skipping SSR for that component) creates worse problems.

### Discriminated unions and exhaustive checks

A discriminated union is a TypeScript type where multiple shapes are distinguished by a common field:

```ts
type Action =
  | { type: "ADD"; payload: BasketItem }
  | { type: "REMOVE"; payload: { productId: string; size: string } }
  | { type: "CLEAR" };
```

Inside a reducer, switching on `action.type` lets TypeScript narrow which fields are available in each case. If you add a new variant and forget to handle it, you can catch this with a `never` assignment in the default case:

```ts
default: {
  const _exhaustive: never = action;
  return state;
}
```

This trick: anything assigned to `never` must itself be `never`. If you've narrowed all cases above, the remaining type is `never` and the assignment compiles. If you missed a case, the compiler errors. Bug prevented at compile time.

### Table-driven code (Record over switch)

For "if X then return Y" where Y is just a value, prefer a `Record` to a switch statement:

```ts
// Less good:
function categoryLabel(c: Category): string {
  switch (c) {
    case "men": return "Pria";
    case "women": return "Wanita";
    // ...
  }
}

// Better:
const CATEGORY_LABELS: Record<Category, string> = {
  men: "Pria",
  women: "Wanita",
  // ...
};
```

Why the Record is better:
- TypeScript forces you to fill in every key. Add a new Category value? The file won't compile until you add the label. Switch statements don't have this guarantee without the `never` trick.
- It's data, not logic. You can iterate it (`Object.entries(CATEGORY_LABELS)`), swap it for a function (`getLabel(c, locale)`), or read it from an external source later.
- It's half the lines of code.

**When the switch IS right:** each branch does meaningfully different work, not just returns a different value.

### Modal accessibility basics

A modal that meets basic accessibility:
- `role="dialog"` and `aria-modal="true"` on the wrapper
- `aria-labelledby` pointing at the title element
- Closes on Escape key
- Closes on backdrop click
- Locks `body` scroll while open
- Focus management (trap focus inside, return focus on close) — we deferred this

Most of these are added in a `useEffect` that runs while the modal is mounted. Always include a cleanup function (return value from useEffect) that undoes everything: remove the keydown listener, unset `body.style.overflow`.

---

## Phase 2 — Database and API layer

### What we built

- A Prisma schema with a `Product` model
- A SQLite database, migrated
- A seed script populating 13 products
- A typed Prisma Client, regenerated on every migration
- A singleton pattern so the Client survives Next.js hot-reload
- A `/api/products` Route Handler
- A refactored `ProductSection` that queries the database directly

### Schema design — the decisions worth understanding

**ID strategy.** Three options:

- `String @id @default(cuid())` — collision-resistant, opaque, hard to guess sequentially
- `String @id @default(uuid())` — same idea, different format
- `Int @id @default(autoincrement())` — sequential, predictable, small

For public-facing IDs in URLs (like `/product/{id}`), sequential is dangerous. An attacker can probe `/product/1`, `/product/2`, ... and learn how many products you have, how new each is, your growth rate. Use `cuid()` for anything user-facing.

For internal IDs that never leave your server (a job ID, an internal log row), autoincrement is fine and uses less storage.

**Currency as integer.** Indonesian Rupiah has no decimal places. Stored as `Int`. **Money should almost never be `Float`** because binary floating-point can't exactly represent decimal values like `0.1`. Errors accumulate. Use integers representing the smallest unit (cents, sen) or a fixed-point decimal type.

**Json columns for arrays on SQLite.** SQLite has no array type. You have three options:

1. Comma-delimited string — ugly, no validation
2. `Json` field — Prisma serializes/deserializes for you
3. Relational — separate table with foreign key

For simple data (image URLs, size strings) where you don't query inside the array, `Json` is fine. For data you need to query/index inside (per-size inventory), use a relational table.

**Enum design — when to use enums.** A field is a good enum candidate when its values are:
- **Closed** — the full set is known
- **Stable** — values rarely change
- **Homogeneous** — values represent the same kind of thing

`Category` (men, women, kids, school, custom) passes all three. `size` does NOT — letter sizes (S/M/L) and numeric pant sizes (30/32/34) are different measurement systems. Forcing them into one enum creates `enum Size { S, M, L, SIZE_30, SIZE_32, ... }` — fighting the language. Use a string for size.

**Timestamps.** `DateTime @default(now())` for `createdAt`, `DateTime @updatedAt` for `updatedAt`. The `@updatedAt` is a Prisma feature — every update sets the field automatically. Always include both. You'll need them for debugging, audit logs, and "newest first" sorting.

### Reading the generated SQL

Every migration generates a `.sql` file in `prisma/migrations/<timestamp>_<name>/migration.sql`. **Always open it.** That file is the literal SQL that runs against your database. Things you learn from reading it that you can't learn from the schema:

- Whether your `@default` becomes a database-level default or a client-side computation. `@default(now())` becomes `DEFAULT CURRENT_TIMESTAMP` in SQL. `@default(cuid())` does not — cuid is generated by Prisma in JavaScript before INSERT.
- How relations become foreign keys (`FOREIGN KEY ... REFERENCES ... ON DELETE CASCADE`).
- How `@unique` creates an index (`CREATE UNIQUE INDEX`).
- Which constraints exist at the database layer vs only at the application layer.

The ORM is a typed convenience over SQL, not a replacement for understanding SQL.

### The Prisma Client singleton

In normal Node.js, modules are loaded once. A `let prisma = new PrismaClient()` at module scope means one client per process. Fine.

But Next.js dev mode uses **hot module replacement (HMR)** — when you save a file, Next.js re-evaluates the changed modules. Each re-evaluation creates a new `PrismaClient`. After 50 saves, you have 50 client instances holding 50 database connections. SQLite is forgiving; Postgres will refuse connections.

The fix is to store the client on `globalThis`, which survives module re-evaluation:

```ts
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

Two subtle things:

1. **`globalThis` and `globalForPrisma` are the same object.** Assigning an object to a variable creates a new reference, not a copy. Setting `globalForPrisma.prisma = prisma` is the same as setting `globalThis.prisma = prisma`. The variable `globalForPrisma` exists only to give TypeScript a typed view of the global object.

2. **The cache only runs in development.** Production doesn't have HMR. Caching on `globalThis` in production can cause real issues in serverless environments (Vercel, Lambda) where the global object can leak state between invocations.

The pattern shows up everywhere — Redis clients, telemetry SDKs, anything that's "one-per-process and expensive to recreate."

### Route Handlers — the API layer

A `route.ts` inside `src/app/api/.../route.ts` defines an HTTP endpoint at that URL. Function names match HTTP verbs:

```ts
export async function GET()    { ... }  // browser visits, fetch GET
export async function POST()   { ... }  // form submit, fetch POST
export async function PUT()    { ... }  // updates
export async function DELETE() { ... }  // deletes
```

The basic shape:

```ts
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  return Response.json(products);
}
```

Important rules:

- **A folder can have either `page.tsx` or `route.ts`, never both.** They claim the same URL.
- **`Response.json(...)` is the easy way to return JSON.** Returns a properly-shaped HTTP response with the right Content-Type header.
- **Functions are async.** All your DB calls are awaitable.

For dynamic routes like `/api/products/{id}`, create a `[id]` folder:

```
src/app/api/products/[id]/route.ts
```

And read the param from the handler:

```ts
export async function GET(req, { params }) {
  const { id } = await params;
  // ...
}
```

### The DTO pattern — separating data shape from view shape

Your database has one shape; your UI wants a slightly different one. Don't make the UI bend to the database — write a mapper.

In our case, Prisma returns `Product` rows with:
- `sizes: JsonValue` (could be anything)
- `images: JsonValue`
- `createdAt: Date`
- `description: string | null`

But our UI type expects:
- `sizes: string[]`
- `images: string[]`
- `createdAt: string`
- `description: string | undefined`

The mapper bridges them:

```ts
function toViewModel(p: PrismaProduct): Product {
  return {
    id: p.id,
    name: p.name,
    category: p.category as Product["category"],
    brand: p.brand ?? undefined,
    price: p.price,
    sizes: p.sizes as string[],
    images: p.images as string[],
    description: p.description ?? undefined,
    createdAt: p.createdAt.toISOString(),
  };
}
```

This is sometimes called the **DTO pattern** (Data Transfer Object). The UI doesn't import the Prisma type directly — it imports its own `Product` type and the data is mapped at the boundary. If the database schema changes (Prisma adds a field, removes a column), only the mapper needs to update. The UI stays oblivious.

In smaller projects you can skip this. In any project that will grow, it pays off quickly.

---

## Phase 3 — Authentication

### What we built (so far)

- `User` and `Session` tables in the schema
- `hashPassword()` and `verifyPassword()` helpers using `bcryptjs`
- `getSession()` helper that turns a cookie into a logged-in user
- `setSessionCookie()` helper that creates the session cookie with the right flags
- `POST /api/auth/register` endpoint
- `POST /api/auth/login` endpoint
- `POST /api/auth/logout` endpoint
- `GET /api/auth/me` endpoint
- *Pending:* the frontend refactor to use these endpoints

### Why hash, not encrypt

Encryption is reversible. With the key, you can decrypt and recover the plaintext. Hashing is one-way — there is no "unhash" function.

For passwords, hashing is correct because:

1. **You don't actually need the plaintext after registration.** To verify a login, you hash the user's attempt and compare to the stored hash. You never need to "look up the user's password."
2. **If your database leaks, hashed passwords are unusable.** An attacker has hashes only. To recover the original passwords, they have to guess and check — and `bcrypt` is intentionally slow to make this expensive.
3. **Encryption keys would have to live somewhere.** Usually on the same server as the database. An attacker who steals the database probably also steals the key. Encryption gives you no real protection in that scenario.

The principle: **don't store data you don't need.** Hashing means you literally can't leak the password — even if you tried, you don't have it.

### Salts and per-user uniqueness

bcrypt's stored hash format is:

```
$2b$12$<salt><hash>
```

The `2b` is the algorithm version. The `12` is the cost factor. The salt is **unique per user**, generated randomly when the password was first hashed.

Two users with the same password get **different stored hashes**, because the salt is different. This means:

- An attacker can't precompute a "rainbow table" of common passwords and look them up. They'd have to recompute for every user's salt.
- One user's hash can never validate another user's password attempt.

`bcrypt.compare(plaintext, storedHash)` extracts the salt from the stored hash, applies it to the plaintext, computes the comparison hash, and checks. You never need to handle the salt yourself.

### Cost factor

bcrypt has a tunable "work factor" between 4 and 31. Higher = slower per hash = harder to brute-force.

- 10 — the legacy default
- 12 — modern default (about 200ms per hash on typical hardware)
- 14 — high security, noticeably slow

The work factor is embedded in the stored hash. You can increase it later — new users get the new factor, existing hashes keep working. Use 12 unless you have a reason otherwise.

### Sessions vs JWT

Two ways to keep a user logged in:

**Session cookie + DB.** Generate a random session ID, store a row in the database linking it to a user, send the ID to the browser as a cookie. Every request, browser sends the cookie, server looks up the session in the DB. Pros: can revoke instantly (delete the row), opaque tokens. Cons: a DB lookup per request.

**JWT (JSON Web Token).** Sign a token containing user info, send it to the browser. Browser sends it back. Server verifies the signature. Pros: stateless, no DB lookup. Cons: hard to revoke (token is valid until expiry no matter what), info in the token can grow stale, security footguns if misconfigured.

For a server-rendered web app, **session cookies are usually correct.** JWTs are for mobile apps and machine-to-machine APIs where you want stateless auth.

### Cookie security flags

When we set the session cookie:

```ts
cookieStore.set("session_id", sessionId, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  expires: expiresAt,
  path: "/",
});
```

Each flag closes a specific attack vector:

- **`httpOnly: true`** — JavaScript on the browser cannot read this cookie. Prevents XSS attacks (cross-site scripting) from stealing the session.
- **`secure: true`** — cookie only sent over HTTPS. Prevents network sniffing on insecure connections. We gate it on production because dev is usually HTTP.
- **`sameSite: "lax"`** — cookie sent on top-level navigation but blocked on cross-site iframe/POST. Prevents most CSRF attacks (cross-site request forgery). `"strict"` is more secure but breaks return-after-redirect flows; `"lax"` is the standard balance.
- **`expires`** — when the cookie auto-deletes from the browser. Match the database session's expiry.
- **`path: "/"`** — cookie sent for every URL on your domain.

**Skipping any of these creates a real vulnerability.** Don't.

### The two HTTP status codes you must use correctly

- **200 OK** — "the request succeeded." Use for successful reads (GET), successful logins (the resource already existed), or successful logouts.
- **201 Created** — "a new resource was created." Use only for successful POST/PUT that creates something new. Register returns 201.
- **400 Bad Request** — "the request was malformed." Use when input validation fails.
- **401 Unauthorized** — "we can't authenticate you." Use when login credentials are wrong, or when an authenticated route is hit without auth.
- **403 Forbidden** — "we know who you are, but you don't have permission for this."
- **404 Not Found** — "the resource doesn't exist."
- **409 Conflict** — "the request conflicts with the current state." Use when registering an already-taken email.
- **500 Internal Server Error** — "something blew up on our side." Don't manually return this; let unhandled errors bubble up.

**Use them correctly.** Frontends, monitoring tools, and CDNs all branch on these codes. Returning 200 for failures hides bugs.

### Generic error messages on login

When login fails, never reveal whether the email exists or the password was wrong:

```ts
return Response.json(
  { error: "Invalid email or password" },
  { status: 401 }
);
```

Both "email not found" and "wrong password" cases return the same message. Why:

If you returned "Email not found" vs "Wrong password," an attacker could probe millions of emails and learn which ones are registered. They'd then target those emails with phishing or credential-stuffing attacks. **The information has real value to attackers and zero value to legitimate users.**

The principle: **never tell an attacker more than they already know.**

### Idempotency

An idempotent operation produces the same result whether you do it once or N times. Examples:

- Logout — logging out an already-logged-out user should succeed (no error)
- Setting a value — setting `x = 5` is idempotent; incrementing `x++` is not
- DELETE — deleting an already-deleted row should not error

We used `prisma.session.deleteMany(...)` in logout instead of `prisma.session.delete(...)` because `deleteMany` deletes zero or more rows without throwing on zero. The endpoint becomes safe to call from many places — accidental double-clicks, race conditions, retry policies — without surprise errors.

**Key principle:** design APIs so that retries are safe. Idempotent endpoints can be safely re-invoked when networks drop or clients glitch.

### Transactions for related writes

A transaction is a group of database operations that either all succeed or all fail. We used one in the register endpoint:

```ts
const { user, session } = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { ... } });
  const session = await tx.session.create({
    data: { userId: user.id, expiresAt: ... },
  });
  return { user, session };
});
```

Why: if `user.create` succeeded but `session.create` failed (network blip, constraint violation), you'd have a user with no session — orphan data. The transaction guarantees both succeed or both are rolled back. Data integrity is preserved.

**When to use transactions:** any time you're writing to multiple tables for one logical operation. Anywhere you'd say "if step 2 fails, undo step 1," that's a transaction.

### Always await your promises

This is one of the most common bugs in Node.js code:

```ts
// Bug:
prisma.session.deleteMany({ where: { id } });

// Fixed:
await prisma.session.deleteMany({ where: { id } });
```

Without `await`, the function returns immediately. The promise is "floating" — JavaScript will eventually run it, but you don't know when. In a request handler, the response can return before the promise completes. In serverless, the function can be killed mid-promise.

Turn on `@typescript-eslint/no-floating-promises` in your ESLint config to catch this automatically. Until then, scan every Prisma call manually.

---

## Debugging skills

The most valuable skill in this entire project. Code that works on the first try is rare; code that you can debug methodically is common.

### The diagnostic hierarchy

When something doesn't work, check possibilities in this order, cheapest first:

1. **Configuration** — Is the value correct in `.env`, `package.json`, etc.?
2. **Encoding** — Is the file actually what you think it is? (NUL bytes, BOM markers, wrong line endings)
3. **Runtime context** — What does the running code see? `console.log(process.env.X)`.
4. **Build pipeline** — Has bundling changed paths or stripped code?

We hit all four during Phase 2 trying to fix one error. The actual cause was layer 4 (Next.js bundling changed `import.meta.url` resolution). But layers 1-3 needed to be eliminated first.

### Verify file state, not just configuration

When you change a configuration file (`.env`, `tsconfig.json`), don't assume it worked. Actually inspect the saved file:

```bash
file .env          # tells you the file type — ASCII, binary, etc.
xxd .env           # shows the literal bytes
wc -c .env         # file size
```

We caught a real bug this way — the `.env` file had 8 trailing NUL bytes from a Windows write quirk, making it look fine in the editor but binary to tools.

### Read the actual generated artifact, not the source

When code works in one context (Prisma Studio) but not another (Next.js dev server), the difference is usually how the build pipeline transforms the code. Open the generated output. Search for the value or path you expect to see. If it's not there, the build did something you didn't expect.

We diagnosed the Prisma path bug by reading `src/generated/prisma/internal/class.ts` and noticing it used `import.meta.url` for path resolution — which breaks when Next.js bundles modules.

### "When a fix doesn't fix, that's data"

If you apply a fix and the problem persists, you've learned something — you've eliminated a suspect. Don't apply the same fix again (a common reflex). Don't apply a related fix (a related reflex). Step back and reconsider whether your hypothesis was right.

Pretending a fix worked when it didn't is how a 30-minute bug becomes a 4-hour bug.

### Own your wrong guesses

If you proposed a fix and it was wrong, say so. "My earlier diagnosis was wrong — here's what I missed." This isn't weakness; it's the only way debugging stays productive. Defending wrong hypotheses costs more than admitting them.

### Hex-dump when "but it looks right"

When something *should* work and doesn't, and the file or config *looks* fine, dump the bytes. `xxd` and `hexdump` exist for exactly this reason. Three seconds of checking can save you an hour of guessing.

---

## Engineering habits worth keeping

### Read what you write before you save

Every file you save, scan once visually. Look for:
- Typos in identifier names (`Prisma` vs `prisma`)
- Missing `await`
- Unused imports
- Variables referenced but never declared

The editor and TypeScript catch some of this; ESLint catches more; your eyes catch the rest. The cost of catching a bug before saving is zero. The cost after deployment is hours.

### Tests in `curl` or DevTools before the UI exists

When you build an API endpoint, test it from the command line or browser DevTools before wiring up the frontend. Two reasons:

1. You isolate "does the endpoint work?" from "does the frontend call it correctly?"
2. You learn the request/response shape interactively, which informs the frontend code you'll write.

If the endpoint works in `curl` and breaks in the frontend, you know the bug is in the frontend. If both fail, the bug is in the endpoint.

### Migrations are permanent

Once a migration is applied, undoing it requires another migration. Treat migration commits with care:

- Use descriptive names: `add_auth_models`, not `update`
- Read the generated SQL before applying it
- Test on dev data first, never directly on production
- Never edit a migration that's already been applied — make a new one

### Extract after the second duplication, not before

Don't extract code into a helper the first time you write it. Wait until you've written it twice. The second time tells you which parts are stable and which are situational.

We extracted `setSessionCookie` after writing the cookie-setting block twice in register and login. The first writing was the design; the second was the validation; the third would have been one too many.

### Test edges, not just happy paths

When you build a feature, test:
- The happy path (valid input, expected behavior)
- The failure path (invalid input, error handling)
- The edge cases (empty arrays, null values, missing data)
- The malicious path (oversized input, SQL injection attempts, unexpected types)

For our login endpoint:
- Happy: right email, right password → 200 + session
- Failure: right email, wrong password → 401
- Edge: empty body → 400
- Malicious: SQL injection attempt in email → safely rejected by Zod

### Use the type system as documentation

When you write a function, give it a precise return type:

```ts
// Less good — return type inferred
function getSession() {
  // ...
}

// Better — explicit contract
function getSession(): Promise<{ user: User } | null> {
  // ...
}
```

The explicit type tells readers (and future-you) what the function promises. It also catches bugs where the implementation drifts from the intended return shape.

---

## Glossary

**API endpoint** — A URL on your server that accepts HTTP requests and returns responses. In Next.js, defined in `route.ts` files.

**bcrypt** — A password hashing algorithm designed to be slow, making brute-force attacks expensive. We use the `bcryptjs` package.

**Client Component** — A React component that runs in the browser. Marked with `"use client"`. Can use hooks, state, browser APIs.

**Cookie** — Small data stored by the browser, sent with every request to the matching domain. Used for sessions, preferences, tracking.

**CSRF (Cross-Site Request Forgery)** — Attack where a malicious site tricks the user's browser into making requests to another site where they're logged in. Mitigated by `SameSite` cookie flag and CSRF tokens.

**cuid** — Collision-resistant unique identifier. Random-looking, opaque, suitable for public IDs.

**DTO (Data Transfer Object)** — A type that defines the shape of data crossing a layer boundary. Used to insulate UI from database shape.

**HMR (Hot Module Replacement)** — Next.js dev feature that re-evaluates changed modules without restarting the server. Causes the Prisma singleton issue.

**httpOnly cookie** — A cookie that JavaScript can't read. Used for session IDs to prevent XSS theft.

**Idempotent** — An operation that produces the same result whether done once or many times.

**JWT (JSON Web Token)** — A signed token containing user info, used for stateless auth.

**Migration** — A versioned change to the database schema, applied via Prisma CLI.

**ORM (Object-Relational Mapper)** — A library that translates between database tables and program objects. Prisma is an ORM.

**Prisma Client** — The generated, typed code you use to query the database.

**Pure function** — A function that takes inputs and returns outputs without affecting the outside world.

**Reducer** — A pure function that takes a state and an action and returns a new state. Used by `useReducer`.

**Route Handler** — A Next.js file that defines an HTTP endpoint (`route.ts`).

**Salt** — Random data added to a password before hashing, unique per user. Prevents rainbow table attacks.

**Server Component** — A React component that runs only on the server in Next.js App Router. Default for components in `src/app/`.

**Session** — A server-side record that ties a logged-in user to a specific browser. We store sessions in the `Session` table.

**Singleton** — A pattern where only one instance of a class exists. Used for the Prisma Client.

**Transaction** — A group of database operations that either all succeed or all fail.

**XSS (Cross-Site Scripting)** — Attack where a malicious script runs in another user's browser context. Mitigated by `httpOnly` cookies and input sanitization.

**Zod** — A TypeScript-first validation library for runtime schema checking.

---

## Self-test questions

Read these questions and try to answer in your head before checking the rest of the document or the code. If you can't answer, that's the part to re-read.

### Foundations

1. Why does the auth provider live in `layout.tsx` instead of `page.tsx`?
2. What's the rule for which components can be Server Components?
3. When should you use `Record<K, V>` instead of a switch statement?

### Database

4. Why is `cuid()` preferable to `autoincrement()` for public-facing IDs?
5. Why should money never be stored as `Float`?
6. What's the difference between `@default(cuid())` and `@default(now())` at the SQL layer?
7. What's the purpose of `@@index([userId])` on the `Session` table?

### Auth

8. Why hash a password instead of encrypting it?
9. What does the `httpOnly` flag do, and what attack does it prevent?
10. What does `sameSite: "lax"` do, and what attack does it prevent?
11. Why does the login endpoint return the same error for "email not found" and "wrong password"?
12. Why is logout a `POST`, not a `GET`?
13. What's the consequence of forgetting `await` before a Prisma call in a route handler?
14. Why do we use `deleteMany` instead of `delete` in the logout endpoint?
15. Why do register and login wrap their DB writes in a transaction?

### Patterns

16. Why does the Prisma singleton use `globalThis` and gate the cache on `NODE_ENV !== "production"`?
17. What's the DTO pattern, and when does it pay off?
18. Why is `setSessionCookie` extracted to `auth.ts` instead of inlined in each route?

### Debugging

19. If a config change isn't taking effect, what's the first thing to check?
20. What command tells you the byte-level content of a file?
21. If a fix doesn't fix the bug, what should you do?

---

## What comes next

Phase 3 has one piece remaining: the **AuthContext refactor + LoginModal refactor**. After that, all auth is real end-to-end.

Phase 4 (AI integration) is on the horizon — product recommendations and a chatbot. The foundation we've built (database, API, auth) supports both directly.

Keep this document with your project. Update it as you learn. Re-read it when stuck. The principles outlast the framework versions.

Good engineering is mostly discipline. Take care of the foundations and the features take care of themselves.
