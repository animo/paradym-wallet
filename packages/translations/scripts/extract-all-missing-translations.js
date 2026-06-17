import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const localesDir = process.argv[2]

if (!localesDir) {
  console.error('Usage: node extract-all-missing-translations.js <locales-dir>')
  process.exit(1)
}

function extractForLocale(translationPath) {
  const resolvedTranslationPath = path.resolve(translationPath)
  const translations = JSON.parse(readFileSync(resolvedTranslationPath, { encoding: 'utf-8' }))

  const missingEntries = Object.fromEntries(
    Object.entries(translations).filter(([, { translation }]) => translation === '')
  )

  const missingEntriesPath = path.join(path.dirname(resolvedTranslationPath), 'missing.json')
  writeFileSync(missingEntriesPath, JSON.stringify(missingEntries, null, 2))

  console.log(
    `Wrote ${Object.keys(missingEntries).length} missing entries to ${path.relative(process.cwd(), missingEntriesPath)}`
  )
}

const resolvedLocalesDir = path.resolve(localesDir)
const locales = readdirSync(resolvedLocalesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== 'en')
  .map((entry) => entry.name)

for (const locale of locales) {
  extractForLocale(path.join(resolvedLocalesDir, locale, 'messages.json'))
}
