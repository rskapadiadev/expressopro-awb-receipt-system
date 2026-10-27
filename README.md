# ExpressPro AWB Receipt System

AWB receipt system with dynamic fields, a drag-and-drop template designer and bulk printing. It runs entirely on the Cloudflare free tier:

- React (Vite) single-page app, served as Worker static assets
- Hono API on the same Worker
- Cloudflare D1 database, accessed with Drizzle

## Roles

| Role        | Who               | Can do                                                                          |
| ----------- | ----------------- | ------------------------------------------------------------------------------- |
| Super Admin | Platform owner    | Everything: field library, template designer, template assignment, all users    |
| Admin       | Courier company   | Manage franchise users, see and void all receipts, use all active templates     |
| User        | Franchise / store | Create and print receipts using their branch's templates, see own receipts only |

The permission matrix lives in [shared/permissions.ts](shared/permissions.ts). Both the API and the UI use it.

## Local setup

Requires Node 22 or later. The repo has an `.nvmrc`, so run `nvm use` in this folder.

```bash
npm install
npm run db:migrate:local
npm run db:seed:local -- --password 'ChooseAStrongPassword'
npm run dev
```

The seed command creates:

- the `superadmin` login
- a starter field library (sender, receiver, destination, pieces, weight, payment mode, …)
- a "Standard A5" template
- a sample branch (`SURT`)
- a **Consignment Note (3 copies)** template that recreates the paper C-Note

Run the seed with `--username <name>` to choose a different login name.

## Everyday commands

| Command               | What it does                                                    |
| --------------------- | --------------------------------------------------------------- |
| `npm run dev`         | Dev server with the real Workers runtime and local D1           |
| `npm run lint`        | ESLint, zero warnings allowed                                   |
| `npm run format`      | ESLint autofix, then Prettier                                   |
| `npm run typecheck`   | TypeScript project build                                        |
| `npm test`            | Unit tests (Vitest)                                             |
| `npm run check:size`  | Builds and shows the Worker upload size (free plan limit: 3 MB) |
| `npm run db:generate` | Creates a new migration after editing `worker/db/schema.ts`     |

A pre-commit hook (husky + lint-staged) runs ESLint and Prettier on staged files.

## Code style

- Indentation is 4 spaces.
- Object literals with 2 or more properties put each property on its own line. ESLint `@stylistic/object-property-newline` enforces this, and Prettier `objectWrap: "preserve"` keeps it.
- Write inline parameter types as named interfaces. Prettier collapses inline types, which conflicts with the rule above.
- Comments are one line, and only where the reason isn't obvious.

## UI

- Built on [shadcn/ui](https://ui.shadcn.com) (the `Sidebar`, dialogs, dropdowns, tooltips and toasts) with Tailwind CSS v4.
- The font is **Hanken Grotesk**, bundled locally via `@fontsource-variable`, so there are no external font requests.
- Colours are shadcn theme tokens in [src/index.css](src/index.css), with separate light and dark themes. Users switch theme from the user menu or the header toggle. Receipt paper always stays white so it prints correctly.
- Files that shadcn generated (`src/components/ui/{sidebar,button,dialog,…}.tsx`, `src/hooks/use-mobile.ts`) are treated as vendored code and are exempt from a few lint rules. Add more shadcn components with `npx shadcn@latest add <name>`.
- Responsive behaviour:
    - On phones the sidebar becomes a slide-in drawer.
    - Tables turn into cards.
    - The bulk-print bar floats at the bottom of the screen.

## Deploying to Cloudflare (free)

1. `npx wrangler login`
2. `npx wrangler d1 create expresspro-awb`, then copy the printed `database_id` into [wrangler.jsonc](wrangler.jsonc).
3. `npm run db:migrate:remote`
4. `npm run db:seed:remote -- --password 'ChooseAStrongPassword'`
5. `npm run deploy`

The app is then live at `https://expresspro-awb.<account>.workers.dev`.

### Custom subdomain (free)

1. Add the domain to Cloudflare (Free plan), then change its nameservers at the registrar to the two Cloudflare gives you.
2. Before you switch, check that the existing DNS records were imported, especially the email (MX) records.
3. Uncomment the `routes` entry in `wrangler.jsonc` with your subdomain, e.g. `receipts.yourdomain.com`.
4. Run `npm run deploy`. Cloudflare creates the DNS record and SSL certificate automatically.

## How it works

- **Branches** (`/admin/branches`, Super Admin and Admin):
    - Each branch has a unique 4-character code, which is the prefix of its AWB numbers.
    - Every franchise user belongs to one branch, always books under it, and uses that branch's templates.
    - The Super Admin assigns templates per branch (with one default) in the branch form, so new users of a branch need no template setup.
    - Admins and the Super Admin can have no branch. They then pick a branch for each receipt.
- **Field library** (`/admin/fields`): defines each field's key, label, type, required and searchable flags, and dropdown options. A field's key can't change after creation, because saved receipts store their data by key.
- **Templates** (`/admin/templates`): each template sets the paper size in mm and positions elements on a canvas. The fields placed on a template become its entry form.
    - **Elements**: fields, static text, AWB number, booking date, branch, barcode (Code 128), tick mark, company logo, custom image, line and box.
    - **Table cells**: any element can have borders on any side, padding and vertical alignment, so a grid-style C-Note is built from one element per cell.
    - **Text direction**: horizontal, vertical, or stacked letters (e.g. "SHIPPER COPY" down the side).
    - **Tick mark**: prints ✓, X and similar when a field has a given value. For example, ✓ next to AIR when Mode of Transport is AIR.
    - **Copies**: list copy names (e.g. Shipper / Consignee / Office). Each receipt then prints once per copy. Put `{copy}` in a static text element to show the copy name.
    - **Tracing guide**: upload a photo or screenshot of an existing paper receipt as a faded background and place elements on top of it. It's never printed or copied into receipts.
- **Designer shortcuts**:
    - Drag and resize elements with the mouse. Edges snap to other elements and the paper edge; hold Alt/Option to place freely.
    - ⌘C / ⌘V (Ctrl+C / Ctrl+V) copy and paste an element, and ⌘D (Ctrl+D) duplicates it.
    - Arrow keys nudge by 1 mm (Shift for 5 mm). Delete removes the selected element.
    - Undo is ⌘Z (Mac) or Ctrl+Z (Windows). Redo is ⇧⌘Z (Mac) or Ctrl+Y / Ctrl+Shift+Z (Windows). The toolbar has undo and redo buttons too.
    - Undo history keeps the last 100 steps and survives saving. While you're typing in a text box, Ctrl+Z undoes the typing instead.
- **Receipts**: one row per receipt.
    - Values are stored as JSON in `data`.
    - `layout_snapshot` freezes the template, so later template edits never change old prints.
    - AWB numbers are the branch code plus 7 random digits (e.g. `SURT4829174`). The database's unique index catches the rare duplicate, and a fresh number is drawn automatically.
- **Bulk print**: tick receipts in the list and click **Print selected**, up to 100 per batch. A print job can only use one paper size, so a mixed-size selection is split into groups that you print one at a time.
- **Print modes**: there are two, chosen per template and overridable per computer.
    - **One per page** is for roll, thermal and label printers. The page is the template size, so each receipt is its own label.
    - **Multiple per sheet** is for A4 and other normal printers. Receipts are tiled across the sheet, with the sheet size, margin and gap set in the designer. The designer shows how many fit per sheet.
    - The Super Admin sets the default for each template in the designer, under **Printing** (click an empty part of the canvas to see it).
    - On the print screen, **Print as** overrides the default. Each browser remembers its own choice, so a store with a roll printer and an office with an A4 printer can share a template.
    - In the browser's print dialog, choose the same paper size, set margins to **None** and scale to **100%**.
- **Shared renderer**: [ReceiptRenderer](src/components/receipt/ReceiptRenderer.tsx) draws the designer preview, the detail view and the printout. Everything is in mm, so print matches screen.

## Adding a field type

1. Add it to `FIELD_TYPES` and `FIELD_REGISTRY` in [shared/fields.ts](shared/fields.ts) (validation, display format, sample value).
2. Add its input to `INPUTS` in [src/components/fields/FieldInput.tsx](src/components/fields/FieldInput.tsx).
