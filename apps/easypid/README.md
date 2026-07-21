<div align="center">
   <img src="assets/icon.png" alt="Paradym Logo" height="176px" style="border-radius: 15%;" />
</div>

<h1 align="center"><b>Paradym & Funke Wallet</b></h1>

<p align="center">
  <a href="#getting-started">Getting Started</a>
  &nbsp;|&nbsp;
  <a href="#app-types-and-build-variants">App Types & Variants</a>
  &nbsp;|&nbsp;
  <a href="#project-structure">Project Structure</a>
  &nbsp;|&nbsp;
  <a href="#adding-dependencies">Dependencies</a>
  &nbsp;|&nbsp;
  <a href="#releasing">Releasing</a>
</p>

---

This is the Expo React Native app that ships both wallet variants:

- **Paradym Wallet** — the main (stable) wallet published in the app stores.
- **Funke Wallet** — the experimental EUDI Wallet prototype, created by [Animo Solutions](https://animo.id/) in the context of the [SPRIND Funke ‘EUDI Wallet Prototypes’ challenge](https://www.sprind.org/en/challenges/eudi-wallet-prototypes/). It can be tested with our [EUDI playground environment](https://funke.animo.id/), which functions as a test relying party and (Q)EAA issuer. See the [video walkthrough](https://www.youtube.com/watch?v=Hk1A95-4DYw) for an impression, or reach out to <ana@animo.id> for more information.

For a general project overview and the supported standards and protocols, see the [main README](../../README.md).

## Getting Started

Requirements: Node.js `>=22.21.1`, pnpm `11.7.0`, and Xcode (iOS) and/or Android Studio (Android) for the native builds.

First install all dependencies from the repo root:

```sh
pnpm install
```

Then make sure you have a development build of the app on your mobile device:

```sh
cd apps/easypid
pnpm prebuild
pnpm ios # or android
```

You only need to install the development build when **native** dependencies change. If you're only working on JS, you can skip this step if you already have the development build installed.

Once installed, run `pnpm start` from the repo root to start the development server.

### Required checks

After making changes, run from the repo root:

- `pnpm style:fix` — Biome formatting + lint (the only linter/formatter, config in `biome.json`)
- `pnpm types:check` — repo-wide TypeScript check

## App Types and Build Variants

Two environment variables control what is built:

- **`EXPO_PUBLIC_APP_TYPE`** selects the wallet variant: `PARADYM_WALLET` (default) or `FUNKE_WALLET`. This switches branding, bundle identifier, invitation schemes and feature flags (see `app.config.js` and `src/config/features.ts`).
- **`APP_VARIANT`** selects the build profile: `development`, `preview` or `production` (default). Development and preview builds get a suffixed bundle id (`.dev` / `.preview`) so they can be installed alongside the production app. The `pnpm start` / `pnpm ios` / `pnpm android` scripts already set `APP_VARIANT=development`.

Feature flags per app type (`src/config/features.ts`):

| Feature | Paradym | Funke |
| --- | --- | --- |
| DIDComm | ✅ | ❌ |
| AI-based oversharing analysis | ❌ | ✅ |
| Cloud HSM (Wallet Service Provider) | ❌ | ✅ |

## Project Structure

The app uses Expo Router file-based routing starting in [`src/app`](src/app) — each file in this directory is a route. When the app is opened, [`src/app/(app)/_layout.tsx`](<src/app/(app)/_layout.tsx>) is rendered as the main layout. If the wallet is not unlocked, the user is redirected to onboarding (on first launch) or the authentication screen (on return).

Most code lives outside this app shell:

- App-specific features (onboarding, receiving, sharing, proximity, menu, activity) live in [`src/features`](src/features).
- Shared screens, providers and hooks live in [`packages/app`](../../packages/app). Feature code is organized by feature in `packages/app/src/features` — this is the default place to make changes unless the behavior is app-specific.
- UI components live in the Tamagui-based [`packages/ui`](../../packages/ui).

### Agent / SDK

The digital identity functionality is provided by the [`@paradym/wallet-sdk`](../../packages/sdk) package in this repo, which wraps a [Credo](https://github.com/openwallet-foundation/credo-ts) agent instance. It handles wallet unlock (PIN-derived key via KDF, optional biometric unlock), encrypted storage using [Askar](https://github.com/openwallet-foundation/askar-wrapper-javascript), and hardware-backed keys using [Expo Secure Environment](https://github.com/animo/expo-secure-environment).

A good entry point is [invitation resolution](../../packages/sdk/src/invitation/resolver.ts) — most interactions in the app that use the agent (receiving and sharing credentials) start there. See the [SDK README](../../packages/sdk/README.md) for full API documentation.

### Wallet Service Provider

For the Funke variant, a separate [Wallet Service Provider](https://github.com/animo/funke-wallet-provider) allows creating and signing with keys in a Cloud HSM. A separate key ring is created for each wallet, and the wallet communicates with the service based on a key derived from a salt and PIN. The client for this lives in [`src/crypto/WalletServiceProviderClient.ts`](src/crypto/WalletServiceProviderClient.ts).

## Adding Dependencies

Versions are pinned via the pnpm catalog in [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml). When adding a dependency that already exists in the catalog, reference it as `"catalog:"` in the package's `package.json`. When bumping a version, update the catalog entry.

- **Pure JS dependencies** → install them in the package that actually uses them (usually `packages/app` for shared feature code).
- **Native dependencies** (anything with native code) → install them in `apps/easypid`. If you also want autoimport from another package (e.g. `packages/app`), install it there as well with the _exact_ same version — mismatched versions of native modules cause hard-to-debug runtime issues.
- React, react-dom and react-native are pinned via `overrides` in `pnpm-workspace.yaml` to keep a single copy across all native modules.

After any dependency change, run `pnpm install` from the repo root. If native dependencies changed, rebuild the development build (`pnpm prebuild && pnpm ios` / `pnpm android`).

## Translations

The app uses [Lingui](https://lingui.dev) for i18n, with catalogs in [`src/locales`](src/locales). See the [translations README](../../packages/translations/README.md) for how to define translatable text and run the translation workflow.

## Releasing

Uploading builds to App Store Connect and the Google Play Console is automated using GitHub Actions and Expo Build.

Before making a release, update the `version` in `apps/easypid/package.json`. We generally follow semver: patch for fixes, minor for new features, major for large refactorings. User-facing changes are often pushed as minor rather than major, as the wallet is not interacted with by a machine, so "breaking change" is hard to define.

To trigger a release, run the [Continuous Deployment](https://github.com/animo/paradym-wallet/actions/workflows/continuous-deployment.yaml) workflow with:

- Channel set to `production`
- Platform set to `all` (unless you only want to release for iOS OR Android)
- App set to `paradym` (or `funke` for the EUDI Wallet prototype)

This triggers builds in Expo and automatically uploads them to App Store Connect and Google Play. Build numbers are incremented automatically by Expo. Releases are published as internal releases on TestFlight and Google Play for testing, from where you can manually promote them to a public release.

## Device Compatibility

- **Android**: Android 8+ (minSdk 26), with a Hardware Security Module (HSM) and biometric support (e.g. fingerprint sensor, face recognition). Devices without these features will not be able to run the app.
- **iOS**: iOS 16.4+.
