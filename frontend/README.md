# FinFlex Dashboard

A polished, responsive personal-finance dashboard inspired by the supplied FinFlex visual reference. The interface uses a dark editorial workspace, a lime signal color, compact data modules, and generated visual assets to create a deliberate finance-product feel rather than a generic dashboard template.

## What is included

The application is a static React front end with local state for prototype interactions. It includes the following connected screens:

| Screen | Route | Purpose |
| --- | --- | --- |
| Home | `/` | Balance overview, budget, top spending, and recent transactions |
| Analytics | `/analytics` | Cash-flow comparison, category exposure, and spending insights |
| Transfers | `/transfers` | Internal account transfer form with confirmation state |
| Payments | `/payments` | Searchable and filterable full transaction ledger |
| Cards | `/cards` | Card status, freeze/unfreeze, add-card, details, and security actions |
| Notifications | `/notifications` | Activity inbox with read-state behavior and alert routing |
| Profile | `/profile` | Editable profile details and workspace preferences |
| Settings | `/settings` | Notification toggles and security controls |

## Interaction model

The primary controls are wired to meaningful front-end behavior:

- The command button opens a searchable action menu for Analytics, Transfers, Payments, Cards, and Settings.
- Ledger entries open a reusable transaction-detail drawer with status, date, account, category, reference, note, and counterparty details.
- Dashboard tabs filter ledger entries by All, Income, and Spending.
- Dashboard budget ranges update the displayed balance and monthly metrics.
- Analytics period controls update the selected reporting period, while the comparison control changes the chart presentation.
- Transfer submission shows an in-context confirmation message and updates the transfer summary.
- Cards can be frozen and unfrozen, with visible state changes and confirmation feedback.
- Payments supports merchant/category search, type filters, and transaction detail inspection.
- Profile fields can be edited and saved during the current session.
- Settings toggles update immediately and can be saved with confirmation feedback.
- Notification rows mark themselves read and route to the relevant screen.

## Technology

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Wouter for client-side routing
- Lucide React for interface icons
- Sonner for feedback toasts
- Framer Motion and Radix UI primitives are available through the project template

## Project structure

```text
client/
  index.html
  src/
    components/
      AppShell.tsx
      TransactionDrawer.tsx
      ui/
    lib/
      finance-data.ts
    pages/
      Home.tsx
      Analytics.tsx
      Transfers.tsx
      Payments.tsx
      Cards.tsx
      Notifications.tsx
      Profile.tsx
      Settings.tsx
    App.tsx
    app-shell.css
    index.css
server/
  index.ts
shared/
  const.ts
```

## Local development

Install dependencies and start the Vite development server:

```bash
pnpm install
pnpm dev
```

The development server runs on the port provided by the environment, typically `http://localhost:3000`.

## Validation commands

Run TypeScript validation:

```bash
pnpm check
```

Create the production build:

```bash
pnpm build
```

Preview the production client locally:

```bash
pnpm preview
```

## Design direction

The visual system is based on a **Precision Ledger** direction:

- Dark charcoal surfaces establish a calm, focused financial workspace.
- Acid-lime is reserved for active states, positive signals, and primary actions.
- Cyan and emerald add restrained chart differentiation.
- Large numerical values use a tight, monospaced treatment for scanability.
- Rounded panels, subtle inset highlights, controlled gradients, and generated artwork add depth without decorative overload.
- Desktop uses a compact command rail and asymmetric data layout; mobile collapses into a prioritized single-column flow.

## Current scope and next steps

This release is a front-end prototype. Values, accounts, and transaction records are local demonstration data and are not connected to a financial institution or persistent database. Session state resets when the page is reloaded.

Recommended production work:

1. Add authentication and persistent user preferences.
2. Connect account aggregation and transaction APIs through a secure backend.
3. Add real CSV export, transaction search pagination, and audit logging.
4. Add automated component and end-to-end interaction tests.
5. Review financial-product compliance, privacy, and accessibility requirements before public release.

## License

This project is provided as a private product prototype. Add the appropriate license before distributing it outside the project team.
