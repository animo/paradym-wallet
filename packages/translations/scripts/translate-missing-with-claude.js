import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localesDir = process.argv[2]

function extractJsonObject(text) {
  const start = text.indexOf('{')
  if (start === -1) throw new Error(`No JSON object found in Claude response:\n${text}`)

  let depth = 0
  let inString = false
  let esc = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (esc) {
      esc = false
      continue
    }
    if (ch === '\\') {
      esc = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  throw new Error(`Unterminated JSON object in Claude response:\n${text}`)
}

if (!localesDir) {
  console.error('Usage: node translate-missing-with-claude.js <locales-dir>')
  process.exit(1)
}

const readmePath = path.resolve(__dirname, '..', 'README.md')
const readme = readFileSync(readmePath, { encoding: 'utf-8' })

const resolvedLocalesDir = path.resolve(localesDir)
const locales = readdirSync(resolvedLocalesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== 'en')
  .map((entry) => entry.name)

for (const locale of locales) {
  const missingPath = path.join(resolvedLocalesDir, locale, 'missing.json')
  if (!existsSync(missingPath)) {
    console.log(`Skipping ${locale}: no missing.json`)
    continue
  }

  const missing = readFileSync(missingPath, { encoding: 'utf-8' })
  if (Object.keys(JSON.parse(missing)).length === 0) {
    console.log(`Skipping ${locale}: missing.json is empty`)
    continue
  }

  console.log(`Translating ${locale}...`)

  const aiInstructionsPath = path.join(resolvedLocalesDir, locale, 'AI_INSTRUCTIONS.MD')
  const aiInstructions = existsSync(aiInstructionsPath) ? readFileSync(aiInstructionsPath, { encoding: 'utf-8' }) : ''

  const prompt = `You are translating Lingui catalog entries for the Paradym wallet.

Below is the translations package README for context on how translations are defined and used:

<readme>
${readme}
</readme>
${
  aiInstructions
    ? `
Below are locale-specific instructions for "${locale}" with consistency rules and terminology guidance. Follow these instructions when producing translations for this locale:

<locale-instructions>
${aiInstructions}
</locale-instructions>
`
    : ''
}
Translate every entry in the JSON below into the language with ISO code "${locale}". For each entry, fill in the empty "translation" field with the localized string. Keep all keys, ICU placeholders (e.g. {name}), and JSX/component placeholders (e.g. <0/>, <1>...</1>) exactly as in the source "message". Preserve the original JSON structure and key order.

Your entire response MUST be a single JSON object and nothing else: no markdown fences, no prose before or after, no commentary. The first character of your response must be "{" and the last must be "}".

<missing-json>
${missing}
</missing-json>`

  const output = execFileSync('claude', ['-p', prompt], {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit'],
  })

  const parsed = JSON.parse(extractJsonObject(output))
  writeFileSync(missingPath, JSON.stringify(parsed, null, 2))
  console.log(`Wrote translations for ${locale} -> ${path.relative(process.cwd(), missingPath)}`)
}
