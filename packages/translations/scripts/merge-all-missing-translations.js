import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const localesDir = process.argv[2]

if (!localesDir) {
  console.error('Usage: node merge-all-missing-translations.js <locales-dir>')
  process.exit(1)
}

function mergeForLocale(translationPath) {
  const resolvedTranslationPath = path.resolve(translationPath)
  const missingEntriesPath = path.join(path.dirname(resolvedTranslationPath), 'missing.json')

  if (!existsSync(missingEntriesPath)) {
    console.log(`Skipping ${path.basename(path.dirname(resolvedTranslationPath))}: no missing.json`)
    return
  }

  const translations = JSON.parse(readFileSync(resolvedTranslationPath, { encoding: 'utf-8' }))
  const filledInEntries = JSON.parse(readFileSync(missingEntriesPath, { encoding: 'utf-8' }))

  const updatedTranslations = Object.fromEntries(
    Object.entries(translations).map(([key, translationObject]) => [
      key,
      filledInEntries[key]?.translation && filledInEntries[key].translation !== ''
        ? filledInEntries[key]
        : translationObject,
    ])
  )

  writeFileSync(resolvedTranslationPath, JSON.stringify(updatedTranslations, null, 2))

  console.log(
    `Merged ${Object.keys(filledInEntries).length} missing entries into ${path.relative(process.cwd(), resolvedTranslationPath)}`
  )

  unlinkSync(missingEntriesPath)
}

const resolvedLocalesDir = path.resolve(localesDir)
const locales = readdirSync(resolvedLocalesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== 'en')
  .map((entry) => entry.name)

for (const locale of locales) {
  mergeForLocale(path.join(resolvedLocalesDir, locale, 'messages.json'))
}
