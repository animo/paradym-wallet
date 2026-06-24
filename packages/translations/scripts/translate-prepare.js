import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..', '..', '..')
const easypidDir = path.join(workspaceRoot, 'apps', 'easypid')
const translationsDir = path.join(workspaceRoot, 'packages', 'translations')
const defaultLocalesDir = path.join(easypidDir, 'src', 'locales')

const localesDir = process.argv[2] ? path.resolve(process.argv[2]) : defaultLocalesDir

const steps = [
  { cwd: easypidDir, args: ['translations:extract'] },
  { cwd: translationsDir, args: ['extract-all-missing-translations', localesDir] },
]

for (const { cwd, args } of steps) {
  console.log(`\n> pnpm ${args.join(' ')}  (in ${path.relative(workspaceRoot, cwd) || '.'})`)
  execFileSync('pnpm', args, { cwd, stdio: 'inherit' })
}

const relLocales = path.relative(workspaceRoot, localesDir)
console.log(`\nMissing translations written to ${relLocales}/<locale>/missing.json.`)
console.log('Fill in the empty "translation" fields for each locale, then run: pnpm translations:ai:finalize')
