import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localesDir = process.argv[2]
const skillPath = path.resolve(__dirname, '..', '..', '..', '.claude', 'skills', 'translations', 'SKILL.md')

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

if (!existsSync(skillPath)) {
  console.error(`Translations skill not found at ${skillPath}`)
  process.exit(1)
}

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

  const prompt = `Use the "translations" skill at ${skillPath} to translate the Lingui catalog entries below. Follow every rule in that skill — especially the output contract (a single JSON object, no prose, no markdown fences).

Target locale ISO code: "${locale}"
${
  aiInstructions
    ? `
Locale-specific instructions for "${locale}" (apply these on top of the skill's general rules):

<locale-instructions>
${aiInstructions}
</locale-instructions>
`
    : ''
}
<missing-json>
${missing}
</missing-json>`

  // Pass the prompt over stdin rather than as an argv argument: large catalogs
  // (e.g. a full locale with hundreds of entries) exceed the OS ARG_MAX limit
  // and fail with spawnSync E2BIG.
  const output = execFileSync('claude', ['-p'], {
    input: prompt,
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'inherit'],
  })

  const parsed = JSON.parse(extractJsonObject(output))
  writeFileSync(missingPath, JSON.stringify(parsed, null, 2))
  console.log(`Wrote translations for ${locale} -> ${path.relative(process.cwd(), missingPath)}`)
}
