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
  { cwd: translationsDir, args: ['merge-all-missing-translations', localesDir] },
  { cwd: easypidDir, args: ['translations:extract'] },
  { cwd: easypidDir, args: ['translations:compile'] },
  { cwd: workspaceRoot, args: ['style:fix'] },
]

for (const { cwd, args } of steps) {
  console.log(`\n> pnpm ${args.join(' ')}  (in ${path.relative(workspaceRoot, cwd) || '.'})`)
  execFileSync('pnpm', args, { cwd, stdio: 'inherit' })
}
