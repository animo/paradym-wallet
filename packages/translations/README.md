<div align="center">
   <img src="../../assets/icon.png" alt="Paradym Logo" height="176px" />
</div>

<h1 align="center"><b>Translations</b></h1>

This package contains utils for tranlations based on the Lingui package.

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

In the `packages/translations` directory run the following command. Make sure to change the language identifier for the language you want to add messages to.

```sh
pnpm extract-missing-translations ../../apps/easypid/src/locales/<lang>/messages.json
```

This will generate a new `missing.json` file at `../../apps/easypid/src/locales/<language>/missing.json`. Copy the contents of this file to Claude/ChatGPT with the following message, make sure to change the `<Language>` into the full language name.

```
Hi, i've used Lingui (https://lingui.dev/ref/macro) to create translation files for my user-facing identity app. Can you help me translate the files into <Language> by filling the "translation" attribute? Take into account the comments and placeholders according to their intent from the Lingui library .The translations need to be pleasant, informal, to the point, natural and in a similar vain to the original text. Please make sure to watch out to not create too literal translations that would not make sense in the translation language.
```

After you got the translations, place them in the same `missing.json` file, and then run:

```sh
pnpm merge-missing-translations ../../apps/easypid/src/locales/<lang>/messages.json
```

Once this is done you can extract and compile the new messages. From the `apps/easypid` directory run the following commands.

```sh
pnpm translations:extract
pnpm translations:compile

# before comitting make sure to also run formatting
cd ../..
pnpm style:fix
```