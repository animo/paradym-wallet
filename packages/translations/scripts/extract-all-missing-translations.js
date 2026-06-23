import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const localesDir = process.argv[2]

if (!localesDir) {
  console.error('Usage: node extract-all-missing-translations.js <locales-dir>')
  process.exit(1)
}

const resolvedLocalesDir = path.resolve(localesDir)
const enMessagesPath = path.join(resolvedLocalesDir, 'en', 'messages.json')

function gitShow(ref, filePath) {
  return execFileSync('git', ['show', `${ref}:${filePath}`], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
}

function tryGit(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

function getChangedSourceKeys() {
  if (!existsSync(enMessagesPath)) return new Set()

  const repoRoot = tryGit(['rev-parse', '--show-toplevel'])
  if (!repoRoot) return new Set()

  const relPath = path.relative(repoRoot, enMessagesPath)

  const baseRef =
    tryGit(['merge-base', 'origin/main', 'HEAD']) ||
    tryGit(['merge-base', 'main', 'HEAD']) ||
    tryGit(['rev-parse', 'HEAD'])
  if (!baseRef) return new Set()

  let baseContent
  try {
    baseContent = gitShow(baseRef, relPath)
  } catch {
    return new Set()
  }

  let baseEn
  try {
    baseEn = JSON.parse(baseContent)
  } catch {
    return new Set()
  }

  const currentEn = JSON.parse(readFileSync(enMessagesPath, { encoding: 'utf-8' }))
  const changed = new Set()
  for (const [key, entry] of Object.entries(currentEn)) {
    const baseEntry = baseEn[key]
    if (baseEntry && typeof baseEntry.message === 'string' && baseEntry.message !== entry.message) {
      changed.add(key)
    }
  }
  return changed
}

const changedSourceKeys = getChangedSourceKeys()
if (changedSourceKeys.size > 0) {
  console.log(
    `Detected ${changedSourceKeys.size} English source string(s) changed since base; marking for re-translation.`
  )
}

function extractForLocale(translationPath) {
  const resolvedTranslationPath = path.resolve(translationPath)
  const translations = JSON.parse(readFileSync(resolvedTranslationPath, { encoding: 'utf-8' }))

  const missingEntries = Object.fromEntries(
    Object.entries(translations)
      .filter(([key, { translation }]) => translation === '' || changedSourceKeys.has(key))
      .map(([key, entry]) => [key, changedSourceKeys.has(key) ? { ...entry, translation: '' } : entry])
  )

  const missingEntriesPath = path.join(path.dirname(resolvedTranslationPath), 'missing.json')
  writeFileSync(missingEntriesPath, JSON.stringify(missingEntries, null, 2))

  console.log(
    `Wrote ${Object.keys(missingEntries).length} missing entries to ${path.relative(process.cwd(), missingEntriesPath)}`
  )
}

const locales = readdirSync(resolvedLocalesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== 'en')
  .map((entry) => entry.name)

for (const locale of locales) {
  extractForLocale(path.join(resolvedLocalesDir, locale, 'messages.json'))
}
