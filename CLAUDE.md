## What this is

Paradym Wallet is a mobile SSI (Self-Sovereign Identity) wallet that holds and presents digital credentials. The same Expo app ships as two variants, selected at build time via the `APP_VARIANT` env var read in `apps/easypid/base.app.config.js`:

- **Paradym** — the general-purpose Animo/Paradym wallet for issuing and verifying W3C/AnonCreds/SD-JWT VCs over DIDComm and OID4VC.
- **Funke / EUDI** — a prototype built for the SPRIND Funke EUDI Wallet Challenge, targeting the EU Digital Identity Wallet (EUDI) flows (PID issuance, OID4VP presentations to relying parties, etc.).

The variants share almost all code; the difference is branding, bundle id, and which issuers/verifiers/protocol profiles are wired up. Treat shared code in `packages/app` as the default place to make changes unless the behavior is variant-specific.

## Working principles

Bias toward caution over speed. Use judgment on trivial tasks.

**Think before coding.** State assumptions explicitly; ask if uncertain. If multiple interpretations exist, surface them — don't pick silently. If a simpler approach exists, say so. If something is unclear, stop and name what's confusing.

**Simplicity first.** Write the minimum code that solves the problem. No features beyond what was asked, no abstractions for single-use code, no configurability that wasn't requested, no error handling for impossible scenarios. If a senior engineer would call it overcomplicated, simplify.

**Surgical changes.** Every changed line should trace directly to the request. Don't "improve" adjacent code, comments, or formatting. Don't refactor what isn't broken. Match existing style. Remove imports/variables your changes orphaned; leave pre-existing dead code alone (mention it if notable).

**Goal-driven execution.** Translate vague tasks into verifiable goals before starting. For UI / flow behavior, don't invent new unit-test suites to verify it — there's no Maestro skill yet (TODO), so ask the user to verify the change manually on device and tell them exactly what to check. Existing unit tests in utility packages (e.g. `packages/utils`) are fair game — run and extend those when the change is pure logic. For multi-step work, state a brief plan with a verification check per step so you can loop independently instead of asking for clarification mid-flight.

## Required checks before finishing

After making any code changes, always run from the repo root:

- `pnpm style:fix` — Biome formatting + lint autofix (with `--unsafe`)
- `pnpm types:check` — repo-wide `tsc --noEmit`

Fix any errors these surface before reporting the task as done. There is no ESLint/Prettier — Biome is the only linter/formatter (config in `biome.json`).

## Repo layout

pnpm monorepo (workspace defined in `pnpm-workspace.yaml`). Node `>=22.21.1`, pnpm `11.7.0`.

- `apps/easypid` — the Expo React Native app shell. Hosts both wallet variants (Paradym and Funke/EUDI), selected via `APP_VARIANT` in `apps/easypid/base.app.config.js`. Native config, app entry, and variant-specific wiring live here.
- `packages/app` — shared screens, features, providers, hooks. Most feature code lives here, not in `apps/easypid`. Feature code goes in `packages/app/src/features/<feature-name>/` — don't add a `screens/` folder.
- `packages/ui` — Tamagui-based UI kit.
- `packages/scanner` — QR scanning utils.
- `packages/translations` — Lingui setup and the `translate-all.js` script.
- `packages/utils`, `packages/sdk` — shared helpers / SDK surface.

## Dependency rules (important, easy to get wrong)

- **Versions are pinned via the pnpm `catalog:`** in `pnpm-workspace.yaml`. When adding a dep that already exists in the catalog, reference it as `"catalog:"` in the package's `package.json` instead of hardcoding a version. When bumping, update the catalog entry, not individual packages.
- **Pure JS deps** → install in the package that actually uses them. If a dep is consumed from shared feature code, that's usually `packages/app`; a UI-only dep belongs in `packages/ui`; a util-only dep in `packages/utils`. Don't blanket-install in `packages/app` if nothing there imports it.
- **Native deps (any native code)** → install in `apps/easypid`. If you also need autoimport from `packages/app` (or another package), install in both with the *exact* same version, otherwise the duplicate copies cause hard-to-debug runtime issues.
- React, react-dom, and react-native are pinned via `overrides` in `pnpm-workspace.yaml` to keep a single copy across all native modules. Don't loosen these.
- After any dependency change, run `pnpm install` from the repo root.

## Stack specifics

- **Expo SDK 56**, React Native 0.85.3, React 19.2.3. Expo Router for navigation.
- **Tamagui** for UI — has a Babel plugin; use Tamagui primitives over raw RN components where possible.
- **Credo (`@credo-ts/*` 0.6.3)** is the SSI/agent framework. `@openid4vc/*` handles OID4VCI/VP. Askar (`@openwallet-foundation/askar-*`) is the secure storage / crypto backend.
- **Lingui** for i18n — see the Translations section below. Do not edit non-English `.po` catalogs by hand.
- **Biome** with single quotes, no semicolons, 120-col, ES5 trailing commas, 2-space indent. `noUnusedImports` is an error.
- Native development build is required when native deps change: `cd apps/easypid && pnpm prebuild && pnpm ios` (or `android`). JS-only changes only need `pnpm start` from the repo root.

## Translations

Use the `translations` skill (`.claude/skills/translations/SKILL.md`) for any translation work, including running the `pnpm translations:ai:prepare` / `pnpm translations:ai:finalize` pipeline, updating Lingui catalogs, or changing English source strings that need to propagate to other locales.
