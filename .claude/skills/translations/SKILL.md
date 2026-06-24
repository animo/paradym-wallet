---
name: translations
description: Translate Lingui catalog entries for the Paradym wallet across locales. Use when translating missing entries, running the `pnpm translations:ai` workflow, updating English source strings that need propagation to other locales, or when invoked by `packages/translations/scripts/translate-missing-with-claude.js`.
---

# Paradym wallet translations

Translation tooling for the Paradym wallet is built on [Lingui](https://lingui.dev). Catalogs live under `apps/easypid/src/locales/<locale>/messages.json`. The `en` locale is the source of truth; all other locales must stay in sync with it.

## When this skill applies

- The user asks to update, generate, or fix translations.
- A script (typically `translate-missing-with-claude.js`) invokes Claude with a missing-translations payload.
- English source strings have changed and other locales need to be brought back in sync.
- A new locale is being added (see `packages/translations/README.md`).

## Running the full workflow

From the workspace root:

```bash
pnpm translations:ai
```

This pipeline runs for every locale under `apps/easypid/src/locales` except `en`:

1. `translations:extract` in `apps/easypid` — refresh catalogs from source.
2. `extract-all-missing-translations` — write a `missing.json` next to each locale's `messages.json`.
3. `translate-missing-with-claude` — invoke the `claude` CLI per locale, using each locale's `AI_INSTRUCTIONS.MD` and the `missing.json`. This step is what loads this skill.
4. `merge-all-missing-translations` — merge each `missing.json` back into `messages.json` and delete `missing.json`.
5. `translations:extract` + `translations:compile` in `apps/easypid`.
6. `style:fix` at the workspace root.

The workflow must always end with `translations:compile` and `style:fix`. `pnpm translations:ai` already does both. There is no per-locale workflow — all non-`en` locales are processed together.

## Locale-specific instructions

Every non-`en` locale has an `AI_INSTRUCTIONS.MD` file at `apps/easypid/src/locales/<locale>/AI_INSTRUCTIONS.MD` with terminology, formality, and consistency guidance for that language. When translating for a locale, follow these instructions exactly. If a new consistent rule emerges during translation (e.g. a recurring term that needs a fixed translation), update `AI_INSTRUCTIONS.MD` for that locale so future runs stay consistent.

## Translating missing entries (programmatic invocation)

When `translate-missing-with-claude.js` invokes Claude, the input contains:

- A locale ISO code (e.g. `de`, `fr`, `nl`).
- The contents of that locale's `AI_INSTRUCTIONS.MD` (if present).
- A `missing.json` payload of catalog entries where each entry's `translation` field is empty.

For each entry, fill in the empty `translation` field with the localized string and follow these rules strictly:

- Translate into the language with the given ISO code.
- Keep all keys, ICU placeholders (e.g. `{name}`, `{count, plural, ...}`), and JSX/component placeholders (e.g. `<0/>`, `<1>...</1>`) **exactly** as they appear in the source `message`. Do not rename, reorder, or translate placeholder content.
- Preserve the original JSON structure and key order.
- Apply the locale's `AI_INSTRUCTIONS.MD` for terminology, tone, and consistency.

### Output contract for the script

When invoked from the script, the response **must** be a single JSON object and nothing else:

- The first character of the response must be `{` and the last must be `}`.
- No markdown fences, no prose before or after, no commentary, no explanation.

The script parses the response as JSON and writes it back over `missing.json`. Any deviation breaks the pipeline.

## Defining translatable strings (for reference)

Source strings use Lingui macros. See `packages/translations/README.md` for full examples; the short version:

- Component: `<Trans>Hello</Trans>` from `@lingui/react/macro`.
- Hook: `const { t } = useLingui(); t('Hello')`.
- Outside React: `defineMessage\`...\`` + `i18n.t(...)`.

Each can take an explicit `id` and `comment` for translator context. When changes are made to English strings, run the full workflow above so other locales pick up the change.
