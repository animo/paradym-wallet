# End to End Test with Maestro Documentation

## Requirements (macOS)

To use Maestro on macOS, Java 17 is required. Make sure Java 17 is installed and correctly configured in your `JAVA_HOME`.

---

## Installing the Maestro CLI

### Option 1: Install via installation script

```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
```

### Option 2: Install via Homebrew

If you use Homebrew, you can install Maestro with:

```bash
brew tap mobile-dev-inc/tap
brew install maestro
```

---

## Using Maestro

### Maestro CLI

The flows use the `id.paradym.wallet.preview` app, so install a preview build on the simulator or emulator first. For example, for iOS from `apps/wallet`:

```bash
APP_VARIANT=preview npx expo prebuild --platform ios
APP_VARIANT=preview npx expo run:ios --configuration Release --no-bundler
```

Then run the tests from the `/apps/wallet/.maestro` directory:

**Playground**

```bash
maestro test --exclude-tags=didcomm,screenshots -e MAESTRO_ISSUER_BACKEND=playground .
```

The Digital Credentials API flow (`digital-credentials-api` tag) needs iOS 26 or later on iOS. Exclude the tag when running on an older simulator.

**Paradym**

The flows use the Paradym project `cmipr5x5x00l6s6018op8cbci`. Paradym only supports issuance without authorization:

```bash
maestro test --exclude-tags=authorization-code-flow,authorization-presentation-during-issuance,authorization-tx-code,digital-credentials-api,screenshots -e MAESTRO_ISSUER_BACKEND=paradym -e MAESTRO_PARADYM_API_KEY=<api_key> .
```

---

### Maestro Studio (local testing)

Maestro Studio is recommended for local development. Although still in beta, it works well and provides an interactive interface for writing, debugging, and running tests directly in your development environment.

---

## Expo Workflows

The [End-to-End Maestro Test](https://github.com/animo/paradym-wallet/actions/workflows/e2e-maestro-tests.yaml) GitHub workflow runs the Expo workflows below for the branch it's dispatched on, and waits for them. The GitHub run fails when a build or a flow fails:

```bash
gh workflow run e2e-maestro-tests.yaml --ref <branch> -f platform=all -f issuer_backend=playground
```

It reads the Paradym API key from the `PARADYM_API_KEY` repository secret.

You can also run the Expo workflows from your machine if you have the correct Expo token. This uploads your local project, including uncommitted changes:

**Android**

```bash
npx eas-cli@latest workflow:run .eas/workflows/e2e-test-android.yaml
```

**iOS**

```bash
npx eas-cli@latest workflow:run .eas/workflows/e2e-test-ios.yaml
```

You can also run the workflows non-interactively by adding the `--non-interactive` flag and providing the inputs for the issuer backend (`playground`, `paradym`, or `both`).
The `paradym_api_key` is optional but required if the issuer backend is set to `paradym` or `both`. Add `--wait` to wait for the result.

Running these commands triggers a workflow that reuses an earlier `e2e-test` build with the same fingerprint, or builds with the `e2e-test` profile (also found in `eas.json`), and then runs the Maestro job.
