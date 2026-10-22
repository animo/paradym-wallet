---
name: update-dependencies
description: Update the monorepo's npm dependencies where feasible and open grouped PRs - patch, minor and Expo-compatible updates in one PR, an Expo SDK upgrade and each major update in their own PR, skipping what doesn't work. Use for the weekly dependency update run, or when asked to update dependencies or fix vulnerable dependencies.
allowed-tools: Read, Edit, Write, Glob, Grep, WebFetch, WebSearch, Skill, Bash
---

# Update dependencies

Update as much as can be updated safely. One update that doesn't work never blocks the others: skip it, write down why, and continue. The run ends with PRs for everything that passed the checks, and a list of what was skipped.

Read the "Dependency rules" in `AGENTS.md` first. They apply to every change here.

## Groups and branches

Each group gets its own branch from the latest `origin/main` and its own PR:

| Group | Branch | Contents |
|---|---|---|
| Updates | `deps/updates` | Patch and minor updates, Expo-managed packages at the versions the current SDK expects, security fixes that stay within the current major |
| Expo SDK | `deps/expo-sdk-<version>` | An Expo SDK upgrade, with React, React Native and every Expo-managed package that comes with it |
| Major | `deps/<name>-<major>` | One major update, or one package family that is released together (`@credo-ts/*`, `@openid4vc/*`, `tamagui` and `@tamagui/*`, `@openwallet-foundation/askar-*`) |

Every run works through all groups: the Updates group, then the Expo SDK group when a newer SDK exists, then the majors. Don't end the run after the Updates group. Open at most 3 new major PRs per run, most important first: security fixes, then packages this repo depends on most.

## 1. Check what's already open

```bash
gh pr list --state all --label dependencies --limit 200 --json number,state,headRefName,title,closedAt \
  --jq '.[] | select(.headRefName | startswith("deps/"))'
```

- An open PR for a group: rebuild its branch from the latest `origin/main`, force push (`git push --force-with-lease`) and update the PR body. Don't open a second PR.
- A PR closed without merging: someone declined that update. Skip the same target version. A newer version than the one in the closed PR may be proposed again.

## 2. Collect

Run from the repo root:

```bash
pnpm outdated -r --format json
pnpm audit --json
pnpm --filter paradym-wallet exec expo install --check
pnpm view expo dist-tags --json
```

`pnpm audit` can take several minutes: run it with a 10 minute timeout.

- Versions shared across packages live in the `catalog:` of `pnpm-workspace.yaml`. Update the catalog entry, not the packages that reference it.
- Packages that `expo install --check` lists are Expo-managed. Outside the Expo SDK group they only move to the versions the current SDK expects. `--check` exits with 1 while any are behind. Don't use `--fix`: it writes versions into `apps/wallet/package.json`, also for packages that use `catalog:`. Set the expected versions yourself, in the catalog where the package uses it.
- `react`, `react-dom` and `react-native` are pinned in `overrides`. Only the Expo SDK group changes them, to the versions the new SDK expects.
- Pre-release pins, like `@credo-ts/*` alphas, compare against the matching dist-tag (`pnpm view <name> dist-tags`), not `latest`. A newer pre-release is a Major group.
- A dependency in `patchedDependencies` needs its patch to apply to the new version. If `pnpm install` can't apply it, update the patch only when the change is small and clear. Otherwise skip the update.
- pnpm's `minimumReleaseAge` holds back releases that are too new. Don't add them to `minimumReleaseAgeExclude`; they come in a later week.
- A native dependency in both `apps/wallet` and `packages/app` keeps the exact same version in both.

## 3. Apply and verify, one group at a time

For each group:

1. `git switch -C <branch> origin/main`.
2. Make the changes, then `pnpm install`.
3. Run the checks:

   ```bash
   pnpm build
   pnpm style:fix
   pnpm types:check
   pnpm --filter paradym-wallet exec expo install --check
   ```

4. When a check fails, find the update that causes it. Fix it when the fix is small and follows the package's migration notes: a renamed import, a changed option, a type. Otherwise revert that update and add it to the skipped list with the error. Then run the checks again.
5. `packages/sdk` is published to npm. If its `package.json` dependencies changed, add a changeset: a file in `.changeset/` with `'@paradym/wallet-sdk': patch` and one line that says what was updated.
6. Commit with `git commit -s`, as a Conventional Commit with the `deps` scope: `chore(deps): update dependencies`, `chore(deps): upgrade to expo sdk 57`, `chore(deps): update @credo-ts to 0.8`.
7. Push and open or update the PR (`gh pr create --base main --label dependencies`, or `gh pr edit`). The title is the commit message.

### Expo SDK group

Use the `expo-upgrade` skill from the expo plugin. It knows which SDK versions to skip and what changes between them. Read the Expo changelog for the new SDK and check the config plugins in `apps/wallet/base.app.config.js` against it. Also update the SDK version in the "Stack specifics" section of `AGENTS.md`.

### Major group

Read the package's changelog or release notes for the breaking changes. Search the code for every API that changed and fix the uses. If that becomes a larger refactor, skip it and describe in the skipped list what the upgrade needs.

### Vulnerabilities

Fix a vulnerability by updating the direct dependency that brings it in. For a transitive dependency without such an update, add an entry to `overrides` in `pnpm-workspace.yaml`, with a comment that names the advisory, but only when the patched version is semver compatible with the requested range. List what remains open, with the reason.

## 4. PR description

Keep it short and factual:

- **Updated**: a table of package, from, to and type (patch, minor, major, security).
- **Skipped**: a table of package, target version and the reason, with the error message where there is one.
- **Vulnerabilities**: fixed and still open.
- **Checks**: which ran, and that they passed.
- **Testing**: after this run, the workflow tests every pushed branch in the app on iOS and Android (the `test-dependency-update` skill) and comments the results on the PR. Don't test in the app in this run.

## 5. Finish

End with a summary of every group: the PR link, or why there's no PR. Nothing to update is a valid result. Don't open an empty PR. Name any tool or command that was denied, so the workflow can allow it.
