# CLAUDE.md

This is the ExpressPro AWB receipt system: courier consignment receipts with dynamic fields, a drag-and-drop template designer, branch-based AWB numbers, and bulk printing. [README.md](README.md) covers setup and features. This file covers what you need to know before changing code.

## Hard constraints

- **The client pays ₹0.** Everything must fit the Cloudflare **free** tier: a 3 MB Worker bundle, about 10 ms of CPU per request, and D1's free limits. Don't add paid services, server-side rendering, or heavy server dependencies. Run `npm run check:size` after adding Worker dependencies; it's currently about 93 KB gzipped.
- **Use Node 22.** Run `nvm use` first (the repo has an `.nvmrc`). The machine's default Node may be 20, which is too old for current `wrangler` and can't open the local D1 state.
- **Roles:**
    - `super_admin` is the developer/platform owner.
    - `admin` is the client (the courier company).
    - `user` is a franchise or store login.
    - All permissions live in one matrix, [shared/permissions.ts](shared/permissions.ts). Use `can()` for checks in both the API and the UI; never hard-code a role check.

## Commands

```bash
nvm use                      # Node 22
npm run dev                  # Vite + Workers runtime + local D1 (http://localhost:5173)
npm run format               # eslint --fix, then prettier (this order matters, see Code style)
npm run lint                 # zero warnings allowed
npm run typecheck            # tsc -b across app / worker / node projects
npm test                     # vitest (tests/)
npm run db:generate          # after editing worker/db/schema.ts
npm run db:migrate:local     # apply migrations to local D1
npm run db:seed:local -- --password '...'   # super admin, starter fields, sample branch + templates
npm run check:size           # build + Worker upload size
```

To reset local data, delete `.wrangler/state`, then run the migrate and seed commands again.

A pre-commit hook (husky + lint-staged) runs ESLint and Prettier on staged files. **Before finishing any change, run lint, typecheck and tests.**

## Architecture

| Path          | What lives there                                                                                                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `worker/`     | Hono API on `/api/*`, with Drizzle on D1. Routes in `worker/routes`, helpers in `worker/lib`, schema in `worker/db/schema.ts`.                                                                     |
| `src/`        | React SPA (Vite, TanStack Router + Query, Tailwind v4, shadcn/ui). Static assets are served by the same Worker.                                                                                    |
| `shared/`     | Code used by both sides: zod schemas, types, permissions, field registry, layout schema, AWB generator, password hashing. **Put validation here once**; the forms and the API use the same schema. |
| `scripts/`    | The seed script, plus the sample "Consignment Note (3 copies)" template that recreates the client's paper C-Note.                                                                                  |
| `migrations/` | Drizzle SQL migrations. Never edit one that has already been applied; add a new one.                                                                                                               |

Key concepts:

- **Dynamic fields.** `field_definitions` is a global library. Field types are defined once in `FIELD_REGISTRY` ([shared/fields.ts](shared/fields.ts)), which holds validation, display format and a sample value. The UI inputs live in [src/components/fields/FieldInput.tsx](src/components/fields/FieldInput.tsx). A template's entry form is built from `fieldKeysOf(layout)`: the placed **field** elements plus any field a **tick mark** element points at.
- **Templates.** `layout` JSON holds the paper size in mm, the elements, `copies` and `print` settings. All element kinds render in one place, `ElementContent` / `ElementBody` in [ReceiptRenderer.tsx](src/components/receipt/ReceiptRenderer.tsx). The designer, detail page, preview and print page all use it, so a new element kind is added there once. Everything is positioned in mm, which keeps screen and print identical. The tracing image (`templates.guide`) is stored outside `layout` on purpose, so it's never copied into receipts.
- **Receipts** are single rows:
    - `data` is JSON keyed by field key.
    - `layout_snapshot` freezes the layout, the field labels and the branch at booking time, so old receipts never change when a template or branch is edited.
    - There's no items table.
- **Branches.**
    - Each branch has a 4-character unique `code`, and AWB numbers are that code plus 7 random digits ([shared/awb.ts](shared/awb.ts)). The UNIQUE index catches collisions and `withUniqueAwb` draws again.
    - Franchise users must have a branch and always book under it. Admins with no branch pick one for each receipt.
    - Templates are assigned **per branch** in `branch_templates` (one default each), not per user.
- **Printing.** There are two modes: `single`, one receipt per page for roll or label printers, and `sheet`, tiled on A4 and similar. Each template has a default mode, and each browser can override it, stored in localStorage. Each receipt prints once per copy name; `{copy}` in a text element is replaced with the copy's name. A print job can only use one page size, so mixed sizes are split into groups.
- **Auth.** PBKDF2 passwords, with the iteration count tuned for the free-tier CPU budget. Sessions are httpOnly cookies backed by D1. An account locks after 5 failed logins, and POSTs from other sites are blocked. Users change their own password from the user menu (`POST /api/auth/password`), which signs out their other sessions. Admins reset other people's passwords from the Users page.

## Code style (user requirements, enforced by tooling)

- Indent with 4 spaces.
- **Object literals with 2 or more properties put each property on its own line.**
    - A single-property object stays on one line: `{ id }`.
    - Destructuring is left to Prettier, which always collapses it.
    - Inline type literals with 2 or more members, such as function prop types, must be **named interfaces**. Prettier collapses inline ones, which conflicts with the ESLint rule.
- Run ESLint **before** Prettier (`npm run format`). Running them the other way round leaves broken indentation.
- Keep code optimised and DRY. Reuse the existing helpers: `useSave`, `EditorDialog`, `DataTable` / `editColumn`, `PageHeader` / `Card` / `Badge` / `Empty`, `receiptContext`, `stagger`, `cn`.
- Comments are one line, and only where the reason isn't obvious.
- TypeScript is strict, and typescript-eslint runs its strict type-checked rules. Avoid `!` and unnecessary conditions.

## UI conventions

- Use **shadcn/ui**. The app shell is shadcn's `Sidebar` in [AppShell.tsx](src/components/AppShell.tsx). Add components with `npx shadcn@latest add <name>`, then **fix the `from "cn"` import it writes** to `from "@/lib/utils"`. Files shadcn generated are treated as vendored and have a small ESLint override in `eslint.config.js`; add new ones to that list.
- The font is **Hanken Grotesk** (`@fontsource-variable`). Colours are only shadcn tokens from [src/index.css](src/index.css), such as `bg-card`, `text-muted-foreground`, `bg-primary`, `text-success` and `text-warning`. **No raw palette colours** like `slate-*` or `red-600`.
- Both light and dark themes must work. **Receipt paper always stays `bg-white text-black`**, because that's what gets printed.
- Every layout must work on phones. `DataTable` turns into cards below `md`. Use `animate-fade-up` with `style={stagger(i)}` for entrance animations.
- Use `toast` from `sonner` for success feedback; `useSave` already shows "Saved".

## Gotchas (learned the hard way)

- **drizzle-kit renames.** Dropping one table and adding another in the same generate makes it stop and ask whether it's a rename, which fails in a non-interactive shell. Split the change into two migrations. Data copies go in hand-written SQL inside the migration, as in `0005_drop_user_templates.sql`.
- **D1 `batch()` with joins** mixes up columns that share a name, such as `templates.name` and `users.name`. Use `Promise.all` for reads with joins. `batch()` is fine for writes.
- **Animations must not hold a `transform`.** `animate-fade-up` uses `backwards` fill mode. A transform left on an ancestor turns `position: fixed` children (the bulk-print bar) into children positioned against that ancestor.
- **JsBarcode** writes sizes like `"268px"`. Parse them to numbers before building an SVG `viewBox`.
- **Mismatched local runtimes.** Running `wrangler d1 execute` against local state created by a newer Vite-plugin runtime crashes. Keep `wrangler` up to date and use Node 22.
- **Data scope.** API routes must always apply `scopeFor(me)`, which limits `user` to their own receipts. UI hiding isn't enough.
