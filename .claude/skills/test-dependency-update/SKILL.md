---
name: test-dependency-update
description: Test a dependency update branch in the running app on an iOS simulator or Android emulator with Argent - decide what the updates can affect, test that, fix or revert updates that break the app, and report on the PR. Use in the Dependency Updates workflow after a deps/* branch was pushed, or when asked to test a dependency update in the app.
allowed-tools: Read, Edit, Write, Glob, Grep, WebFetch, WebSearch, Skill, Bash, mcp__argent
---

# Test a dependency update

The arguments name the platform (`ios` or `android`), the device, the branch, the results directory and the workflow run URL. The branch is checked out, its dependencies are installed, and the device (an iOS simulator UDID or an Android emulator serial) is booted.

The goal is to find out whether the updates on this branch break the app, and to keep the updates that work. Decide yourself what to test: the checks below are a starting point, not a script.

Read "Building, running and testing the app" in `AGENTS.md` first. It explains the build, the onboarding PIN and how to create playground offers and requests. Read the matching `argent-*` skill before using its tools. You are the only user of this machine: use the booted device from the arguments.

## 1. Find out what changed

```bash
gh pr view <branch> --json number,title,body,url
git diff origin/main...HEAD --stat
git diff origin/main...HEAD -- pnpm-workspace.yaml '**/package.json'
```

For each updated package, find where the app uses it (`Grep` for the import) and read the changelog between the two versions. That tells you what to test.

## 2. Decide what to test

Always:

- The app builds, launches and shows no red error screen.
- Onboarding on a fresh install, and the home screen afterwards.
- No new errors or warnings in the JS logs (`debugger-log-registry`).

Then test what the updates can affect. Some starting points:

| Updated | Test |
|---|---|
| `@credo-ts/*`, `@openid4vc/*`, `@owf/*`, `@sd-jwt/*`, Askar, AnonCreds, crypto libraries | Issuance (no authorization, transaction code, presentation during issuance), presentation, the card details and the activity screen. Both SD-JWT VC and mdoc credentials. |
| Expo SDK, `react-native`, React, any native package or config plugin | All main flows: onboarding, issuance, presentation, sign-in issuance (browser), card details, activity, settings. Also restart the app and unlock it with the PIN, and open the app from a deep link. |
| UI: `tamagui`, Reanimated, Gesture Handler, SVG, Skia, Lottie | Screenshots of the main screens, sheets, animations and scrolling. Compare them with what the screens should look like. |
| Navigation: `expo-router`, `react-native-screens` | Every route you can reach, back navigation, modals and sheets. |
| Storage and security: Keychain, secure storage, MMKV | Restart the app: are the PIN and the credentials still there? |
| `@animo-id/expo-digital-credentials-api` | The Digital Credentials API flow from Safari, on iOS 26 or later only. |
| `@lingui/*`, formatting libraries | Texts, dates and numbers on the screens you visit. |
| Dev tooling only (TypeScript, Biome, types) | Building and launching is enough. |

The Maestro flows in `apps/wallet/.maestro` describe the main flows step by step. Use them as a guide; they target the preview build, not the development build you are testing.

Can't be tested on a simulator or emulator: the camera QR scanner, Bluetooth proximity (mdoc), NFC and hardware-backed keys. List those under "Not tested" when the updates touch them. DIDComm and Paradym-issued credentials need a Paradym API key, which this job doesn't have.

## 3. Build and run

From `apps/wallet`, following `AGENTS.md`:

- iOS: `pnpm prebuild`, then `pnpm ios --device <device> --no-bundler`.
- Android: `pnpm prebuild`, then set `org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1g` in `android/gradle.properties`: the default 2 GB heap runs out next to the emulator. Then `pnpm android --device wallet --no-bundler`: Expo takes the AVD name, adb takes the serial from the arguments. Then `adb -s <device> reverse tcp:8081 tcp:8081`.

Start Metro with `CI=false pnpm start` in the background. With `CI=true`, which GitHub sets, Metro doesn't watch files, so it misses your fixes. Connect the dev launcher to Metro. On Android, open `exp+paradym-wallet://expo-development-client/?url=http://localhost:8081` with `adb shell am start -a android.intent.action.VIEW -d <url> id.paradym.wallet.dev` instead of typing the URL. A build that fails because of an update is a test failure: handle it like one.

The development build doesn't receive `https://paradymwallet.app` links: the App Links and universal links only cover the release builds. After the browser sign-in, open the redirect URL in the app yourself (`adb shell am start -a android.intent.action.VIEW -d <url> id.paradym.wallet.dev`, or `xcrun simctl openurl <device> <url>`).

A problem with this machine is not a reason to stop: work around it. When an Argent tool fails, read `argent server logs`, retry once, and otherwise drive and check the app another way: `xcrun simctl` or `adb` for launching, deep links (`xcrun simctl openurl`, `adb shell am start -d`) and screenshots (`xcrun simctl io <device> screenshot`, `adb exec-out screencap -p`), and the Metro output for JS errors.

Save screenshots of what you tested in the results directory. The workflow uploads it.

## 4. When something breaks

1. Check that the update causes it. If you're not sure, test the same thing with `main`: check out `origin/main` in a separate directory with `git worktree add`, then install and build it there.
2. Find which update causes it. Revert updates one at a time on a scratch branch if needed.
3. Fix it when the fix is small and follows the package's migration notes. Otherwise revert that update: set the old version back, `pnpm install`, and run `pnpm build`, `pnpm style:fix` and `pnpm types:check`.
4. Test the fix or the revert in the app.
5. Commit with `git commit -s` (`fix(deps): ...` or `chore(deps): revert <package> to <version>`), then `git pull --rebase` and push. Another job tests the other platform on the same branch: if the rebase conflicts, don't push and report it instead.
6. Update the PR body: move a reverted update to "Skipped" with what broke.

A failure that also happens on `main` is not caused by the update. Report it, but don't revert anything for it.

## 5. Report

Comment on the PR (`gh pr comment`), one comment per platform:

- **Platform**: iOS or Android, with the simulator or emulator and OS version.
- **Tested**: what you tested and why, and the result of each.
- **Fixed or reverted**: what broke and what you did.
- **Not tested**: what the updates touch but couldn't be tested here, and why.
- **Environment**: any tool or command that was denied or didn't work on this machine, so the workflow can be fixed.
- A link to the workflow run, where the screenshots are.

Keep it short. A test that passed needs one line.

When you're done, stop Metro and call `stop-all-simulator-servers`.
