import { readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const translationPath = process.argv[2]

function mergeMissingTranslations() {
  const resolvedTranslationPath = path.resolve(translationPath)
  const missingEntriesPath = path.join(path.dirname(resolvedTranslationPath), 'missing.json')
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

mergeMissingTranslations()
