import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const translationPath = process.argv[2]

function getMissingTranslations() {
  const resolvedTranslationPath = path.resolve(translationPath)
  const translations = JSON.parse(readFileSync(resolvedTranslationPath, { encoding: 'utf-8' }))

  const missingEntries = Object.fromEntries(
    Object.entries(translations).filter(
      ([, { translation, message }]) =>
        translation === '' || translation.includes('plural,') !== message.includes('plural,')
    )
  )

  const missingEntriesPath = path.join(path.dirname(resolvedTranslationPath), 'missing.json')
  writeFileSync(missingEntriesPath, JSON.stringify(missingEntries, null, 2))

  console.log(
    `Wrote ${Object.keys(missingEntries).length} missing entries to ${path.relative(process.cwd(), missingEntriesPath)}`
  )
}

getMissingTranslations()
