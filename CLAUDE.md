## Required checks before finishing

After making any code changes, always run from the repo root:

- `pnpm style:fix` — Biome formatting + lint autofix (with `--unsafe`)
- `pnpm types:check` — repo-wide `tsc --noEmit`

Fix any errors these surface before reporting the task as done. There is no ESLint/Prettier — Biome is the only linter/formatter (config in `biome.json`).

## Repo layout

pnpm monorepo (workspace defined in `pnpm-workspace.yaml`). Node `>=22.21.1`, pnpm `11.7.0`.

- `apps/easypid` — the Expo React Native app (Paradym + Funke/EUDI prototype, selected via app config). Both wallets ship from this single app.
- `packages/app` — shared screens, features, providers, hooks. Most feature code lives here, not in `apps/easypid`.
- `packages/ui` — Tamagui-based UI kit.
- `packages/scanner` — QR scanning utils.
- `packages/translations` — Lingui setup and the `translate-all.js` script.
- `packages/utils`, `packages/sdk` — shared helpers / SDK surface.

Organize feature code by feature folder under `features/` — don't add a `screens/` folder.

## Dependency rules (important, easy to get wrong)

- **Versions are pinned via the pnpm `catalog:`** in `pnpm-workspace.yaml`. When adding a dep that already exists in the catalog, reference it as `"catalog:"` in the package's `package.json` instead of hardcoding a version. When bumping, update the catalog entry, not individual packages.
- **Pure JS deps** → install in `packages/app`.
- **Native deps (any native code)** → install in `apps/easypid`. If you also need autoimport from `packages/app`, install in both with the *exact* same version, otherwise the duplicate copies cause hard-to-debug runtime issues.
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
