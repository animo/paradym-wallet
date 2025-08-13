const { readFileSync, writeFileSync } = require('node:fs')
const path = require('node:path')

const translationPath = process.argv[2]

function getMissingTranslations() {
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

getMissingTranslations()
