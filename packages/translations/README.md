<div align="center">
   <img src="../../assets/icon.png" alt="Paradym Logo" height="176px" />
</div>

<h1 align="center"><b>Translations</b></h1>

This package contains utils for translations based on the Lingui package.

## Defining translatable components

To define text in a component that can be translated, Lingui macros should be used. Due to how macros work with the Bable compiler, the macros need to be imported from the lingui package directly.

Some examples are provided below, see the Lingui docs for full reference: https://lingui.dev/ref/macro

### Using a component

```tsx
import { Trans } from '@lingui/react/macro'

export function MyComponent() {
    return (
      <Text><Trans>Hello</Trans></Text>
    )
}
```

You can also define an id or comment:

```tsx
import { Trans } from '@lingui/react/macro'

export function MyComponent() {
    return (
      <Text>
        <Trans 
            id="page.aboutUs"
            comment="Link in navigation pointing to About page"
        >
            About us
        </Trans>
      </Text>
    )
}
```


### Using a hook

```tsx
import { useLingui } from '@lingui/react/macro'

export function MyComponent() {
    const { t } = useLingui()

    return (
      <Text>{t('Hello')}</Text>
    )
}
```

You can also define an id or comment:

```tsx
import { useLingui } from '@lingui/react/macro'

export function MyComponent() {
    const { t } = useLingui()

    return (
      <Text>{t({
        id: 'page.aboutUs'
        comment: "Link in navigation pointing to About page",
        message: "About us",
      })}</Text>
    )
}
```

### Outside of React

```ts
import { defineMessage } from '@lingui/core/macro'
import { i18n } from '@package/translations'

const name = 'Timo'
const userErrorMessage = defineMessage`Something went wrong, please try again ${name}`

export function somethingOutsideReact() {
    return i18n.t(userErrorMessage)
}
```

You can also define an id or comment:

```ts
defineMessage({
  id: 'page.aboutUs'
  comment: "Link in navigation pointing to About page",
  message: "About us",
})
```

## Extracting translations

Make sure dependencies are installed, then from the `apps/easypid` directory run `pnpm translations:extract` and it will generate the translation files in `apps/easypid/src/locales`.

To add more locales, update `apps/easypid/lingui.config.js`.

## Adding a new language

You need to add the language in several places:
- In `apps/easypid/index.ts`
- Add the locale in the `commonMessages.ts`
- Update the `lingui.config.js`
- Update the `i18n.ts` file

Then run `pnpm translations:extract` in the `apps/easypid` directory. After that you can follow the steps from "Translating with AI". Make sure to do this for all existing languages, since we have translations for the language identifier as well.

## Translating with AI

### How to start

Inside a Claude Code session at the workspace root, prompt Claude with something like:

- "Update the translations"
- "Run the translation workflow"
- "Use the translations skill to update the catalogs"

Any of these will load the `translations` skill (`.claude/skills/translations/SKILL.md`) and Claude will then run `pnpm translations:ai:prepare`, fill in each locale's `missing.json` per its `AI_INSTRUCTIONS.MD`, and run `pnpm translations:ai:finalize`. You'll be asked to approve the two pnpm commands.

If you'd rather translate manually (or hand the middle step to a teammate), you can run `pnpm translations:ai:prepare` and `pnpm translations:ai:finalize` directly and fill in the `missing.json` files yourself between the two — the scripts don't care who does the middle step.

### What runs under the hood

Translations are produced by Claude (via Claude Code) directly — no nested `claude` subprocesses are spawned. The workflow has two scriptable halves and one manual middle step:

1. From the workspace root, run `pnpm translations:ai:prepare`. This refreshes the catalogs via `translations:extract` in `apps/easypid`, then writes a `missing.json` next to each non-`en` locale's `messages.json` containing entries that need translating.
2. Fill in the empty `translation` field in every locale's `missing.json`. When running inside a Claude Code session, this is what Claude does directly using the `translations` skill (`.claude/skills/translations/SKILL.md`), reading each locale's `AI_INSTRUCTIONS.MD` for terminology and tone.
3. From the workspace root, run `pnpm translations:ai:finalize`. This merges each `missing.json` back into `messages.json`, deletes the `missing.json` files, re-runs `translations:extract` + `translations:compile` in `apps/easypid`, and runs `style:fix` at the workspace root.

Both scripts take an optional positional arg to override the locales directory (default: `apps/easypid/src/locales`).

The translation rules (placeholder handling, JSON structure preservation, locale-specific instructions, etc.) live in the `translations` skill. Update that skill — not this README — when changing how Claude produces translations.
