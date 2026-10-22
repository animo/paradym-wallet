---
name: test-dependency-update
description: Test a dependency update branch in the running app on an iOS simulator or Android emulator with Argent - decide what the updates can affect, test that, fix or revert updates that break the app, and report on the PR. Use in the Dependency Updates workflow after a deps/* branch was pushed, or when asked to test a dependency update in the app.
allowed-tools: Read, Edit, Write, Glob, Grep, WebFetch, WebSearch, Skill, Bash(pnpm:*), Bash(git:*), Bash(gh pr:*), Bash(curl:*), Bash(xcrun:*), Bash(adb:*), Bash(emulator:*), Bash(lsof:*), mcp__argent
---

# Test a dependency update

The arguments name the platform (`ios` or `android`), the branch, the results directory and the workflow run URL. The branch is checked out and its dependencies are installed.

The goal is to find out whether the updates on this branch break the app, and to keep the updates that work. Decide yourself what to test: the checks below are a starting point, not a script.

Read "Building, running and testing the app" in `AGENTS.md` first. It explains the build, the onboarding PIN and how to create playground offers and requests. Read the matching `argent-*` skill before using its tools. You are the only user of this machine, so you can boot and use any simulator or emulator.

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

- iOS: `pnpm prebuild`, then `pnpm ios --device <simulator> --no-bundler`. Boot an iOS 26 simulator first.
- Android: boot the `wallet` emulator, then `pnpm prebuild` and `pnpm android --device <serial> --no-bundler`.

Start Metro with `pnpm start` in the background and connect the dev launcher to it. A build that fails is a test failure: handle it like one.

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
- A link to the workflow run, where the screenshots are.

Keep it short. A test that passed needs one line.

When you're done, stop Metro and call `stop-all-simulator-servers`.
