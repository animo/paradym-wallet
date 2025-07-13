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