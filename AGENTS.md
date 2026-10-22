## What this is

Paradym Wallet is a mobile SSI (Self-Sovereign Identity) wallet that holds and presents digital credentials: the general-purpose Animo/Paradym wallet for issuing and verifying W3C/AnonCreds/SD-JWT VCs and mdocs over DIDComm and OID4VC, including EUDI flows (PID issuance, OID4VP presentations to relying parties, etc.). The `APP_VARIANT` env var read in `apps/wallet/base.app.config.js` selects the development/preview/production build variant. Wallet features live in `apps/wallet`; credential and protocol logic lives in the SDK (`packages/sdk`).

## Working principles

Bias toward caution over speed. Use judgment on trivial tasks.

**Think before coding.** State assumptions explicitly; ask if uncertain. If multiple interpretations exist, surface them — don't pick silently. If a simpler approach exists, say so. If something is unclear, stop and name what's confusing.

**Simplicity first.** Write the minimum code that solves the problem. No features beyond what was asked, no abstractions for single-use code, no configurability that wasn't requested, no error handling for impossible scenarios. If a senior engineer would call it overcomplicated, simplify.

**Surgical changes.** Every changed line should trace directly to the request. Don't "improve" adjacent code, comments, or formatting. Don't refactor what isn't broken. Match existing style. Remove imports/variables your changes orphaned; leave pre-existing dead code alone (mention it if notable).

**Goal-driven execution.** Translate vague tasks into verifiable goals before starting. For UI / flow behavior, don't invent new unit-test suites to verify it — check it yourself in the simulator with Argent (see Agent tooling). Where that isn't possible (Argent not installed, or hardware features like Bluetooth proximity and the camera), ask the user to verify the change on device and tell them exactly what to check. The repo has no unit test setup yet; ask before adding one. For multi-step work, state a brief plan with a verification check per step so you can loop independently instead of asking for clarification mid-flight.

## Required checks before finishing

After making any code changes, always run from the repo root:

- `pnpm style:fix` — Biome formatting + lint autofix (with `--unsafe`)
- `pnpm types:check` — repo-wide `tsc --noEmit`

Fix any errors these surface before reporting the task as done. There is no ESLint/Prettier — Biome is the only linter/formatter (config in `biome.json`).

## Commits

Use scoped Conventional Commits for every commit (e.g. `feat(app): ...`, `chore(translations): ...`). The scope should be the affected package or area (`app`, `ui`, `translations`, `utils`, `sdk`, `scanner`, `ai`, etc.).

## Issue tracking

Animo contributors track work on the [FUN Jira board](https://animosprints.atlassian.net/jira/software/projects/FUN/boards/41) (project key `FUN`).

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
- For dependency updates, use the `update-dependencies` skill (`.claude/skills/update-dependencies/SKILL.md`), then test each update branch in the app with the `test-dependency-update` skill.

## Stack specifics

- **Expo SDK 58**, React Native 0.88.0, React 19.3.0. Expo Router for navigation. docs.expo.dev and the Expo skills describe the latest SDK, which can be newer than 58: for API references use `https://docs.expo.dev/versions/v58.0.0/`.
- **Tamagui 2** (2.3.3) for UI — has a Babel plugin; use Tamagui primitives over raw RN components where possible. tamagui.dev, its `llms.txt` and Tamagui's agent skill now describe v3 (bare token names, flat conditional values, no `hoverStyle`), which doesn't work here. Write v2: `$` tokens (`bg="$grey-100"`) and `pressStyle`/`hoverStyle` props. Follow the existing `packages/ui` components and check the types in `node_modules/tamagui` when unsure.
- **Credo (`@credo-ts/*` 0.7 alpha)** is the SSI/agent framework. `@openid4vc/*` handles OID4VCI/VP. Askar (`@openwallet-foundation/askar-*`) is the secure storage / crypto backend.
- **Lingui** for i18n — see the Translations section below. Catalogs are `apps/wallet/src/locales/<locale>/messages.json`; do not edit non-English catalogs by hand.
- **Biome** with single quotes, no semicolons, 120-col, ES5 trailing commas, 2-space indent. `noUnusedImports` is an error.
- Native development build is required when native deps change. JS-only changes only need Metro. See "Building, running and testing the app".

## Building, running and testing the app

Verify app changes yourself: build the app, drive it, and check the result on screen and in the logs. Use [Argent](https://argent.swmansion.com) (Software Mansion) for that. It drives iOS simulators, Android emulators and cabled phones: tap, type, screenshots, the accessibility tree, JS logs, network requests, the React tree and profiling. It's installed per user, not in this repo: `npx @swmansion/argent@latest init --global`. Read the matching `argent-*` skill before using its tools. If Argent isn't available, say so and ask the user to verify, with exact steps.

The Claude Code Expo plugin (`expo@claude-plugins-official`, enabled in `.claude/settings.json`) adds Expo, Expo Router and EAS skills and the Expo MCP server, which needs an Expo login.

### Project Environment

This is what Argent's `argent-environment-inspector` subagent would find, so it doesn't need to run.

- Expo dev client app in `apps/wallet` for iOS and Android. Metro runs on port 8081.
- Bundle ID and Android package: `id.paradym.wallet.dev` (development build), `id.paradym.wallet.preview`, `id.paradym.wallet` (production).
- Run commands from `apps/wallet`. `ios/` and `android/` are generated by prebuild and gitignored.

### Choose a device

- Use a simulator or emulator by default. It has the full Argent toolset: Metro debugger, profiler, permission changes, screen recording.
- Several agents can run at once on one machine, and Maestro runs drive simulators too. A booted simulator may belong to someone else, and Argent's own device rules prefer booted ones. Ask the user which simulator to use, or boot one that isn't running yet (`boot-device`). If the screen changes without your input, stop and tell the user.
- Use a physical phone when the feature needs hardware or the user asks for one: Bluetooth proximity (mdoc), the camera QR scanner, the Digital Credentials API from a browser, hardware-backed keys. Ask the user to connect and unlock the phone. Don't pick a cabled phone only because `list-devices` shows it.
  - iPhone: USB, Developer Mode on, developer trusted. Argent installs an ArgentRunner app on the first call, which takes a few minutes. Only interaction tools work there (tap, swipe, type, `describe`, screenshots, `open-url` with `bundleId`). Debug and profile on a simulator. Details: `argent-ios-device-setup`, `argent-ios-device-interact`.
  - Android: USB debugging on and the phone listed in `adb devices`. Run `adb -s <serial> reverse tcp:8081 tcp:8081` so it reaches Metro, again after every reconnect.

### Build and run

1. Check whether port 8081 is free (`lsof -i :8081`), then start Metro in the background: `pnpm start`. If another workspace's Metro has 8081, don't stop it: use `pnpm start --port 8082`, pass that port to Argent's debugger tools, and enter `http://localhost:8082` in the dev launcher.
2. Install the development build at the start of every test session and after anything native may have changed (a pull, a rebase, a dependency, a config plugin, `app.config.js`). Don't try to judge whether the installed build is still current: a native build older than the JS fails in unclear ways.

   ```sh
   export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8  # CocoaPods fails with "Unicode Normalization not appropriate for ASCII-8BIT" without it
   pnpm prebuild
   pnpm ios --device <udid or name> --no-bundler    # or: pnpm android --device <serial> --no-bundler
   ```

   `pnpm ios` and `pnpm android` compute the native fingerprint and reuse a cached build with the same fingerprint (`expo-build-disk-cache`, set up in `base.app.config.js`). The cache is shared by all worktrees on the machine. A cache hit takes about a minute including prebuild. A miss builds and caches the result: 10 to 20 minutes for a first iOS build. On iOS only simulator builds are cached, so a physical iPhone always builds and needs code signing: if signing fails, ask the user.
3. `pnpm ios` opens a link into the app after installing, and iOS asks whether to open it in "Paradym Wallet (Dev)" or "(Preview)". Cancel that dialog. Open the app with Argent's `launch-app` and `id.paradym.wallet.dev` instead, then tap the Metro server in the dev launcher, or "Enter URL manually" with `http://localhost:8081`. After the first time it reconnects by itself. Don't open `exp+paradym-wallet://` links yourself: the preview build registers the same scheme.
4. After JS changes, Fast Refresh usually picks them up. Otherwise reload with `debugger-reload-metro` or `restart-app`.

### Test wallet flows

- Onboarding on a fresh install: Get Started, PIN `111111` (twice), then "Set up later" for biometrics. `apps/wallet/.maestro/onboarding.yaml` has the same steps. The app asks for the PIN again after a restart and when a deep link opens it: tap "Pin number 1" six times in one `run-sequence`.
- Issuance: create an offer on the playground, then `open-url` the deeplink. Offers expire after 3 minutes. More credential IDs are in `PLAYGROUND_CONFIG` in `apps/wallet/.maestro/scripts/request.js`.

  ```sh
  curl -s -X POST https://playground.animo.id/api/offers/create -H 'Content-Type: application/json' \
    -d '{"credentialSupportedIds":["eudi-pid-sd-jwt-bdr"],"authorization":"none","deferBy":"none","requireDpop":false,"requireWalletAttestation":false,"requireKeyAttestation":false}'
  # deeplink: openid-credential-offer://?credential_offer_uri=<urlencoded issuanceSession.credentialOfferUri>
  ```

- Presentation: create a request and `open-url` its `authorizationRequestUri`.

  ```sh
  curl -s -X POST https://playground.animo.id/api/requests/create -H 'Content-Type: application/json' \
    -d '{"request":{"credentials":[{"id":"eudi-pid","formats":["dc+sd-jwt"],"attributes":["given_name","family_name"]}],"combination":"all"},"requestScheme":"openid4vp://","responseMode":"direct_post.jwt","requestSignerType":"x5c","transactionAuthorizationType":"none"}'
  ```

- DIDComm and Paradym-issued credentials need a Paradym API key: ask the user for one.
- QR codes: open the link inside the QR with `open-url`. Test the scanner itself on a physical phone.

### Debug

- JS logs and errors: `debugger-log-registry`, then grep the log file it returns. Metro's own output has bundling errors. A red error screen can be read with `describe`.
- HTTP requests to issuers and verifiers: `view-network-logs` and `view-network-request-details`.
- React tree and JS evaluation: `argent-metro-debugger`. Re-renders and CPU: `argent-react-native-profiler`.
- When you're done, stop the Metro you started, and call `stop-all-simulator-servers` with only the devices you used.

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
