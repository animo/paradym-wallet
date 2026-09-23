#!/usr/bin/env node
// Builds the two JS bundles the wallet ships — the app's own and the digital credentials API
// request UI, which has its own entry point and its own bundle on both platforms — the way the
// native builds do, and writes their sizes to a JSON file. `report-bundle-size.mjs` turns that file,
// optionally against a baseline from main, into the markdown CI posts on the pull request.
//
// The steps mirror `react-native-xcode.sh` and the plugin's Gradle task: Metro through
// `expo export:embed` (unminified, because Hermes does not need it), then `hermesc -O`. The
// bytecode is what ends up in the binary, so that is the number to watch.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'

const require = createRequire(import.meta.url)

const workspaceRoot = path.resolve(import.meta.dirname, '..')
const projectRoot = path.join(workspaceRoot, 'apps/wallet')

// Keep in sync with `apps/wallet/package.json` (`main`) and the `entry` option of the
// `@animo-id/expo-digital-credentials-api` plugin in `apps/wallet/base.app.config.js`.
const targets = [
  { id: 'app', label: 'App', entry: 'index' },
  { id: 'dc-api', label: 'DC API', entry: 'src/features/dc-api/index' },
]
const platforms = ['ios', 'android']

const outputFile = path.resolve(process.env.BUNDLE_SIZE_OUTPUT ?? 'bundle-size.json')
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'paradym-bundle-size-'))

const expoCli = require.resolve('@expo/cli', {
  paths: [path.dirname(require.resolve('expo/package.json', { paths: [projectRoot] }))],
})
const hermesc = path.join(
  path.dirname(require.resolve('hermes-compiler/package.json', { paths: [projectRoot] })),
  'hermesc',
  { darwin: 'osx-bin', linux: 'linux64-bin', win32: 'win64-bin' }[process.platform] ?? 'linux64-bin',
  process.platform === 'win32' ? 'hermesc.exe' : 'hermesc'
)

/** The concrete file Metro is pointed at, preferring the platform variant like the plugin does. */
function resolveEntryFile(entry, platform) {
  const extensions = ['tsx', 'ts', 'jsx', 'js']
  const candidates = [
    ...extensions.map((extension) => `${entry}.${platform}.${extension}`),
    ...extensions.map((extension) => `${entry}.${extension}`),
  ]

  const entryFile = candidates.find((candidate) => fs.existsSync(path.join(projectRoot, candidate)))
  if (!entryFile) throw new Error(`No entry file found for '${entry}' in '${projectRoot}'`)
  return entryFile
}

function buildBundle(target, platform) {
  const name = `${target.id}.${platform}`
  const bundlePath = path.join(workDir, `${name}.js`)
  const sourcemapPath = `${bundlePath}.map`
  const bytecodePath = path.join(workDir, `${name}.hbc`)

  console.log(`\n▸ ${target.label} (${platform})`)
  execFileSync(
    process.execPath,
    [
      expoCli,
      'export:embed',
      '--entry-file',
      resolveEntryFile(target.entry, platform),
      '--platform',
      platform,
      '--dev',
      'false',
      // Hermes does not need minified input, and the native builds do not pass it either.
      '--minify',
      'false',
      '--bundle-output',
      bundlePath,
      '--sourcemap-output',
      sourcemapPath,
      '--assets-dest',
      path.join(workDir, `${name}-assets`),
    ],
    {
      cwd: projectRoot,
      stdio: 'inherit',
      env: { NODE_ENV: 'production', APP_VARIANT: 'production', ...process.env },
    }
  )

  execFileSync(hermesc, ['-emit-binary', '-max-diagnostic-width=80', '-O', '-w', '-out', bytecodePath, bundlePath], {
    stdio: 'inherit',
  })

  const jsBytes = fs.statSync(bundlePath).size
  const { packages, moduleCount } = attributeBytes(bundlePath, sourcemapPath, jsBytes)
  return {
    target: target.id,
    label: target.label,
    platform,
    bytes: {
      hermes: fs.statSync(bytecodePath).size,
      js: jsBytes,
    },
    moduleCount,
    packages,
  }
}

const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** Decodes one `,`-separated source map segment into its variable-length quantity fields. */
function decodeSegment(segment) {
  const fields = []
  let value = 0
  let shift = 0

  for (const character of segment) {
    const digit = base64.indexOf(character)
    value += (digit & 31) << shift
    if (digit & 32) {
      shift += 5
      continue
    }
    fields.push(value & 1 ? -(value >> 1) : value >> 1)
    value = 0
    shift = 0
  }

  return fields
}

/**
 * How many bytes of the bundle each package is responsible for, by attributing every stretch of
 * generated output to the source the map points it at. Hermes gives no such breakdown, so this is
 * the JS view of it — good enough to see what is growing, not a bytecode measurement.
 */
function attributeBytes(bundlePath, sourcemapPath, jsBytes) {
  const sourcemap = JSON.parse(fs.readFileSync(sourcemapPath, 'utf8'))
  const lines = fs.readFileSync(bundlePath, 'utf8').split('\n')
  const bytesPerSource = new Array(sourcemap.sources.length).fill(0)

  // The bundle is not minified, so whole lines — comments, blank lines — carry no mapping of their
  // own. They belong to the module around them, which is the last source something mapped to.
  let sourceIndex = 0
  let lastSourceIndex = null
  const attribute = (index, bytes) => {
    if (index !== null) bytesPerSource[index] += Math.max(bytes, 0)
  }

  sourcemap.mappings.split(';').forEach((line, lineNumber) => {
    const lineLength = lines[lineNumber]?.length ?? 0
    if (!line) {
      attribute(lastSourceIndex, lineLength)
      return
    }

    const segments = line.split(',').map(decodeSegment)
    let column = 0
    for (const [index, fields] of segments.entries()) {
      // Whatever precedes the first segment is still the previous line's source.
      if (index === 0) attribute(lastSourceIndex, fields[0])

      column += fields[0]
      // The segment covers the output up to the next one, or to the end of the line.
      const length = (index + 1 < segments.length ? column + segments[index + 1][0] : lineLength) - column
      if (fields.length > 1) {
        sourceIndex += fields[1]
        lastSourceIndex = sourceIndex
      }
      attribute(lastSourceIndex, length)
    }
  })

  const packages = {}
  let attributed = 0
  for (const [index, bytes] of bytesPerSource.entries()) {
    if (bytes === 0) continue
    const name = packageOf(sourcemap.sources[index])
    packages[name] = (packages[name] ?? 0) + bytes
    attributed += bytes
  }
  // What no source covers: Metro's prelude and module system, and the newline after every line.
  packages['(runtime and newlines)'] = jsBytes - attributed

  return {
    moduleCount: sourcemap.sources.length,
    packages: Object.fromEntries(Object.entries(packages).sort(([, a], [, b]) => b - a)),
  }
}

/** The npm package or workspace directory a source file belongs to. */
function packageOf(source) {
  const segments = source.split(path.sep).join('/').split('/')

  const lastNodeModules = segments.lastIndexOf('node_modules')
  if (lastNodeModules !== -1) {
    const scoped = segments[lastNodeModules + 1]?.startsWith('@')
    return segments.slice(lastNodeModules + 1, lastNodeModules + (scoped ? 3 : 2)).join('/')
  }

  const workspace = segments.findIndex((segment) => segment === 'packages' || segment === 'apps')
  if (workspace !== -1) return segments.slice(workspace, workspace + 2).join('/')

  return '(other)'
}

const bundles = {}
for (const target of targets) {
  for (const platform of platforms) {
    const result = buildBundle(target, platform)
    bundles[`${target.id}.${platform}`] = result
  }
}

fs.rmSync(workDir, { recursive: true, force: true })
fs.writeFileSync(
  outputFile,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      commit: process.env.GITHUB_SHA ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      bundles,
    },
    null,
    2
  )}\n`
)

console.log(`\nWrote ${outputFile}`)
for (const bundle of Object.values(bundles)) {
  console.log(`  ${bundle.label} (${bundle.platform}): ${(bundle.bytes.hermes / 1e6).toFixed(2)} MB of bytecode`)
}
