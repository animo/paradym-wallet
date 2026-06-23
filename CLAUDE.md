## Updating AI Translations

When updating AI translations, make sure to use the `apps/easypid/src/locales/<locale>/AI_INSTRUCTIONS.MD` file for the locale you're updating.

Also make sure to update the AI_INSTRUCTIONS file for the locale if it needs updates based on new context.

Make sure to read the `packages/translations/README.md` for instructions on generating translations. Translations always run for every non-`en` locale at once — there is no single-language workflow. If anything is updated in the english translation it needs to be reflected in the other languages as well.

### Step-by-Step Translation Workflow

From the workspace root, run:

```bash
pnpm translations:ai
```

This pipeline runs for every locale under `apps/easypid/src/locales` (except `en`):

1. `translations:extract` in `apps/easypid` — refresh catalogs from source.
2. `extract-all-missing-translations` — write a `missing.json` next to each locale's `messages.json`.
3. `translate-missing-with-claude` — invoke the `claude` CLI per locale, using each locale's `AI_INSTRUCTIONS.MD` and the `missing.json`.
4. `merge-all-missing-translations` — merge each `missing.json` back into `messages.json` and delete `missing.json`.
5. `translations:extract` + `translations:compile` in `apps/easypid`.
6. `style:fix` at the workspace root.

**Important:** The workflow must always end with `translations:compile` and `style:fix`. `pnpm translations:ai` already does both.
