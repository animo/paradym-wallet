## What this is

Paradym Wallet is a mobile SSI (Self-Sovereign Identity) wallet that holds and presents digital credentials: the general-purpose Animo/Paradym wallet for issuing and verifying W3C/AnonCreds/SD-JWT VCs and mdocs over DIDComm and OID4VC, including EUDI flows (PID issuance, OID4VP presentations to relying parties, etc.). The `APP_VARIANT` env var read in `apps/wallet/base.app.config.js` selects the development/preview/production build variant. Wallet features live in `apps/wallet`; credential and protocol logic lives in the SDK (`packages/sdk`).

## Working principles

Bias toward caution over speed. Use judgment on trivial tasks.

**Think before coding.** State assumptions explicitly; ask if uncertain. If multiple interpretations exist, surface them — don't pick silently. If a simpler approach exists, say so. If something is unclear, stop and name what's confusing.

**Simplicity first.** Write the minimum code that solves the problem. No features beyond what was asked, no abstractions for single-use code, no configurability that wasn't requested, no error handling for impossible scenarios. If a senior engineer would call it overcomplicated, simplify.

**Surgical changes.** Every changed line should trace directly to the request. Don't "improve" adjacent code, comments, or formatting. Don't refactor what isn't broken. Match existing style. Remove imports/variables your changes orphaned; leave pre-existing dead code alone (mention it if notable).

**Goal-driven execution.** Translate vague tasks into verifiable goals before starting. For UI / flow behavior, don't invent new unit-test suites to verify it — there's no Maestro skill yet (TODO), so ask the user to verify the change manually on device and tell them exactly what to check. The repo has no unit test setup yet; ask before adding one. For multi-step work, state a brief plan with a verification check per step so you can loop independently instead of asking for clarification mid-flight.

## Required checks before finishing

After making any code changes, always run from the repo root:

- `pnpm style:fix` — Biome formatting + lint autofix (with `--unsafe`)
- `pnpm types:check` — repo-wide `tsc --noEmit`

Fix any errors these surface before reporting the task as done. There is no ESLint/Prettier — Biome is the only linter/formatter (config in `biome.json`).

## Commits

Use scoped Conventional Commits for every commit (e.g. `feat(app): ...`, `chore(translations): ...`). The scope should be the affected package or area (`app`, `ui`, `translations`, `utils`, `sdk`, `scanner`, `ai`, etc.).

## Repo layout

pnpm monorepo (workspace defined in `pnpm-workspace.yaml`). Node `>=22.21.1`, pnpm `11.7.0`.

- `apps/wallet` — the Expo React Native app: routes (`src/app`), features, config, locales and native config. Feature code goes in `apps/wallet/src/features/<feature-name>/` — don't add a `screens/` folder.
- `packages/app` — shared components, hooks, providers and the scan feature.
- `packages/sdk` — `@paradym/wallet-sdk`: the Credo agent and the OID4VC, DIDComm, DC API, proximity and PaSO flows. Published to npm, so it can't import the private `@package/*` packages (Biome enforces this).
- `packages/ui` — Tamagui-based UI kit.
- `packages/scanner` — QR scanning utils.
- `packages/translations` — Lingui setup and the AI translation scripts.
- `packages/utils` — shared helpers.

## Dependency rules (important, easy to get wrong)

- **Versions are pinned via the pnpm `catalog:`** in `pnpm-workspace.yaml`. When adding a dep that already exists in the catalog, reference it as `"catalog:"` in the package's `package.json` instead of hardcoding a version. When bumping, update the catalog entry, not individual packages.
- **Pure JS deps** → install in the package that actually uses them: `apps/wallet` for feature code, `packages/sdk` for SDK code, `packages/ui` for UI-only deps, `packages/utils` for util-only deps. Don't blanket-install in `packages/app` if nothing there imports it.
- **Native deps (any native code)** → install in `apps/wallet`. If you also need autoimport from `packages/app` (or another package), install in both with the *exact* same version, otherwise the duplicate copies cause hard-to-debug runtime issues.
- React, react-dom, and react-native are pinned via `overrides` in `pnpm-workspace.yaml` to keep a single copy across all native modules. Don't loosen these.
- After any dependency change, run `pnpm install` from the repo root.

## Stack specifics

- **Expo SDK 56**, React Native 0.85.3, React 19.2.3. Expo Router for navigation.
- **Tamagui** for UI — has a Babel plugin; use Tamagui primitives over raw RN components where possible.
- **Credo (`@credo-ts/*` 0.7 alpha)** is the SSI/agent framework. `@openid4vc/*` handles OID4VCI/VP. Askar (`@openwallet-foundation/askar-*`) is the secure storage / crypto backend.
- **Lingui** for i18n — see the Translations section below. Catalogs are `apps/wallet/src/locales/<locale>/messages.json`; do not edit non-English catalogs by hand.
- **Biome** with single quotes, no semicolons, 120-col, ES5 trailing commas, 2-space indent. `noUnusedImports` is an error.
- Native development build is required when native deps change: `cd apps/wallet && pnpm prebuild && pnpm ios` (or `android`). JS-only changes only need `pnpm start` in `apps/wallet`.

## Translations

Use the `translations` skill (`.claude/skills/translations/SKILL.md`) for any translation work, including running the `pnpm translations:ai:prepare` / `pnpm translations:ai:finalize` pipeline, updating Lingui catalogs, or changing English source strings that need to propagate to other locales.

## Releases

### Wallet app

The [Continuous Deployment](https://github.com/animo/paradym-wallet/actions/workflows/continuous-deployment.yaml) workflow builds the app on EAS from the branch it's dispatched on. Agents push and dispatch only when asked in the conversation, and confirm the branch, channel and platform first: `production` uploads to the stores.

1. For a new release, bump `version` in `apps/wallet/package.json`: patch for fixes, minor for features, major only for large overhauls. EAS increments the build number itself. To ship another TestFlight build of the same version, keep the version: Apple doesn't require a new review for it. Preview builds never need a bump.
2. Commit any version bump (`chore(wallet): bump version to <version>`) and push the branch.
3. Dispatch the workflow on that branch and follow the run:

   ```sh
   gh workflow run continuous-deployment.yaml --ref <branch> -f channel=production -f platform=all
   gh run list --workflow continuous-deployment.yaml --branch <branch> --limit 1
   gh run watch <run-id>
   ```

   | `channel` | Result |
   |---|---|
   | `preview` | Internal build, downloadable from expo.dev |
   | `preview-simulator` | Preview build for the iOS simulator |
   | `production` | Store build, submitted to TestFlight and the Google Play alpha track |

   `platform` is `all`, `ios` or `android`.
4. The run ends once EAS has queued the builds (`--no-wait`). Follow the builds on [expo.dev](https://expo.dev/accounts/animo-id/projects/paradym-wallet/builds).
5. Releasing to users happens by hand in App Store Connect and the Google Play Console.

### SDK (`@paradym/wallet-sdk`)

Changes that affect SDK consumers need a changeset (`pnpm changeset`). On every push to `main`, `continuous-deployment-sdk.yaml` publishes an `alpha` snapshot and opens or updates the `chore(release): new version` PR. Merging that PR publishes the stable version.
