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

After installation, you can use the Maestro CLI to automatically run tests from the command line. For example, when you are inside the `/apps/easypid/.maestro` directory:

**Playground**

```bash
maestro test --exclude-tags=didcomm -e MAESTRO_ISSUER_BACKEND=playground .
```

**Paradym**

```bash
maestro test --include-tags=authorization-none -e MAESTRO_ISSUER_BACKEND=paradym -e MAESTRO_PARADYM_API_KEY=<api_key> .
```

---

### Maestro Studio (local testing)

Maestro Studio is recommended for local development. Although still in beta, it works well and provides an interactive interface for writing, debugging, and running tests directly in your development environment.

---

## Expo Workflows

You can run the Expo workflows locally if you have the correct Expo token by using the following commands:

**Android**

```bash
npx eas-cli@latest workflow:run .eas/workflows/e2e-test-android-with-fingerprint-and-repack.yaml
```

**iOS**

```bash
npx eas-cli@latest workflow:run .eas/workflows/e2e-test-ios-with-fingerprint-and-repack.yaml
```

You can also run the workflows non-interactively by adding the `--non-interactive` flag and providing the inputs for the issuer backend (`playground`, `paradym`, or `both`).
The `paradym_api_key` is optional but required if the issuer backend is set to `paradym` or `both`.

Running these commands triggers a workflow that builds with the `e2e-test` profile (also found in `eas.json`), and then runs the Maestro job.