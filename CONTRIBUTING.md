# Contributing to NexusAdmin

Thanks for your interest! Whether you're fixing a bug, adding a module or tightening UX, the process is the same.

## Setup

```bash
git clone <fork-url>
cd nexusadmin
pnpm install
cp .env.example .env.local
# fill DATABASE_URL + AUTH_SECRET
pnpm db:migrate && pnpm db:seed
pnpm dev
```

## Workflow

1. **Branch** off `main` — `feat/<short-name>`, `fix/<short-name>`, `docs/<short-name>`
2. **Code** following the conventions below
3. **Test** locally — typecheck, lint, manual smoke test the affected module
4. **Commit** in conventional-commit style (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`)
5. **PR** with a clear description and screenshots if UI

## Conventions

### Code style

- TypeScript **strict** mode, no `any` unless absolutely required
- Money is **always** integer cents in the DB and on the wire
- Server Actions live under `src/server/actions/<module>.ts`, validate input with Zod, gate with `requirePermission`, write to AuditLog where appropriate
- UI components use the shared shadcn primitives in `src/components/ui/`
- Lists use the shared `<DataTable>` (`src/components/data-table/data-table.tsx`)
- Error messages are user-friendly — show the *why*, not the stack trace

### Adding a module

Follow the recipe in [README.md](./README.md#adding-a-new-module-eg-brands).

### Tests

The project doesn't ship with a test suite by default (deliberately, to keep the starter small). When adding tests:

- Unit: Vitest + Testing Library
- E2E: Playwright (recommend opening Chrome at `localhost:3000` and exercising the full flow)
- Run the manual smoke test in the corresponding phase plan before opening a PR

## What to avoid

- Don't introduce a new state-management library — Server Components + TanStack Query handles 99% of needs
- Don't add a new color palette — extend `THEME_PRESETS` instead
- Don't bypass `requirePermission` in Server Actions
- Don't store unhashed secrets (passwords, API keys) — bcrypt at rest, plaintext only on creation
- Don't hardcode currency symbols — use `formatCurrency()` from `src/lib/utils.ts`

## Reporting bugs

Open an issue with:
- Reproduction steps
- Expected vs actual behavior
- Browser/OS, Node version, Postgres version
- Logs from `pnpm dev` console + browser DevTools

## License

By contributing you agree your contributions are licensed under MIT (see [LICENSE](./LICENSE)).
