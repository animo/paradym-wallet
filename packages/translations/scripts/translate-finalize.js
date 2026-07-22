import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..', '..', '..')
const appDir = path.join(workspaceRoot, 'apps', 'wallet')
const translationsDir = path.join(workspaceRoot, 'packages', 'translations')
const defaultLocalesDir = path.join(appDir, 'src', 'locales')

const localesDir = process.argv[2] ? path.resolve(process.argv[2]) : defaultLocalesDir

const steps = [
  { cwd: translationsDir, args: ['merge-all-missing-translations', localesDir] },
  { cwd: appDir, args: ['translations:extract'] },
  { cwd: appDir, args: ['translations:compile'] },
  { cwd: workspaceRoot, args: ['style:fix'] },
]

for (const { cwd, args } of steps) {
  console.log(`\n> pnpm ${args.join(' ')}  (in ${path.relative(workspaceRoot, cwd) || '.'})`)
  execFileSync('pnpm', args, { cwd, stdio: 'inherit' })
}
