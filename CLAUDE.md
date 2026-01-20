## Updating AI Translations

When updating AI translations, make sure to use the `apps/easypid/src/locales/<locale>/AI_INSTRUCTIONS.MD` file for the locale you're updating.

Also make sure to update the AI_INSTRUCTIONS file for the locale if it needs updates based on new context.

Make sure to read the `packages/translations/README.md` for instructions on generating translations. Also make sure to check for any updated translations (english is the main language), that won't be covered by the missing file. If anything is updated in the english translation it needs to be reflected in the other languages as well.

### Step-by-Step Translation Workflow

When asked to update translations for a specific language, follow these steps:

1. **First, check for changed English translations** (run from `apps/easypid` directory):
   ```bash
   cd apps/easypid
   pnpm translations:extract
   ```
   Then check the git diff for `apps/easypid/src/locales/en/messages.json` to see what changed in English translations. Any changes here need to be reflected in all other languages.

2. **Extract missing translations** (run from `packages/translations` directory):
   ```bash
   cd ../../packages/translations
   pnpm extract-missing-translations ../../apps/easypid/src/locales/<lang>/messages.json
   ```
   This creates a `missing.json` file at `apps/easypid/src/locales/<lang>/missing.json`

3. **Translate the content**:
   - Read the AI_INSTRUCTIONS.MD for the locale: `apps/easypid/src/locales/<lang>/AI_INSTRUCTIONS.MD`
   - Use the instructions to translate content from the `missing.json` file
   - Note that `missing.json` will also include entries where there may be a translation, but it does not match the pluralization, these entries should also be fixed.
   - Also translate any changed translations identified in step 1 (changed English translations must be updated in other languages too)
   - Write the translations back into the same `missing.json` file

4. **Merge translations** (run from `packages/translations` directory):
   ```bash
   pnpm merge-missing-translations ../../apps/easypid/src/locales/<lang>/messages.json
   ```

5. **Extract and compile** (run from `apps/easypid` directory):
   ```bash
   cd ../../apps/easypid
   pnpm translations:extract
   pnpm translations:compile
   ```

6. **Format code** (run from root directory):
   ```bash
   cd ../..
   pnpm style:fix
   ```

Note: `<lang>` should be replaced with the language code (e.g., `de`, `nl`, `fr`, etc.)

**Important:** The workflow must always end with running `translations:compile` in the `apps/easypid` directory followed by `style:fix` from the root directory.