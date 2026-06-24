---
name: translations
description: Translate Lingui catalog entries for the Paradym wallet across locales. Use when the user asks to update or generate translations, when English source strings change and other locales need to be brought back in sync, or when adding a new locale.
---

# Paradym wallet translations

Translation tooling for the Paradym wallet is built on [Lingui](https://lingui.dev). Catalogs live under `apps/easypid/src/locales/<locale>/messages.json`. The `en` locale is the source of truth; all other locales must stay in sync with it.

## When this skill applies

- The user asks to update, generate, or fix translations.
- English source strings have changed and the other locales need to be brought back in sync.
- A new locale is being added (see `packages/translations/README.md`).

## How translation works now

Claude orchestrates the full pipeline directly — no `claude -p` subprocesses are spawned. The flow is:

1. Run `pnpm translations:ai:prepare` from the workspace root. This runs `translations:extract` in `apps/easypid` to refresh catalogs from source, then writes a `missing.json` next to each non-`en` locale's `messages.json` containing entries that need translating (either empty `translation` fields or entries whose English source has changed since the merge base).
2. For each non-`en` locale under `apps/easypid/src/locales`:
   - Read that locale's `AI_INSTRUCTIONS.MD` for terminology, formality, and consistency rules.
   - Read the locale's `missing.json`.
   - Fill in the empty `translation` field for every entry, following the rules below.
   - Write the result back to `missing.json`, preserving structure and key order.
3. Run `pnpm translations:ai:finalize` from the workspace root. This merges each `missing.json` back into `messages.json`, deletes the `missing.json` files, re-runs `translations:extract` + `translations:compile` in `apps/easypid`, and runs `style:fix` at the workspace root.

The pipeline must always end with `translations:compile` and `style:fix` — `pnpm translations:ai:finalize` already does both. There is no per-locale workflow; all non-`en` locales are processed together.

If a locale's `missing.json` is missing or empty, skip it.

## Translation rules

When filling in `translation` fields:

- Translate into the language matching the locale directory name (`de`, `fr`, `nl`, `pt`, `fi`, `sw`, `al`, …).
- Keep all keys, ICU placeholders (e.g. `{name}`, `{count, plural, ...}`), and JSX/component placeholders (e.g. `<0/>`, `<1>...</1>`) **exactly** as they appear in the source `message`. Do not rename, reorder, or translate placeholder content.
- Preserve the original JSON structure and key order of `missing.json`.
- Apply the locale's `AI_INSTRUCTIONS.MD` for terminology, tone, and consistency.

## Locale-specific instructions

Every non-`en` locale has an `AI_INSTRUCTIONS.MD` file at `apps/easypid/src/locales/<locale>/AI_INSTRUCTIONS.MD`. Read it before translating that locale and follow it exactly. If a new consistent rule emerges during translation (e.g. a recurring term that needs a fixed translation), update `AI_INSTRUCTIONS.MD` for that locale so future runs stay consistent.

## Defining translatable strings (for reference)

Source strings use Lingui macros. See `packages/translations/README.md` for full examples; the short version:

- Component: `<Trans>Hello</Trans>` from `@lingui/react/macro`.
- Hook: `const { t } = useLingui(); t('Hello')`.
- Outside React: `defineMessage\`...\`` + `i18n.t(...)`.

Each can take an explicit `id` and `comment` for translator context. When English strings change, run the full workflow above so other locales pick up the change.
