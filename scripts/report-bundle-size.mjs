#!/usr/bin/env node
// Renders the JSON `measure-bundle-size.mjs` writes as the markdown CI posts on a pull request,
// against the baseline the last run on main cached — when there is one.
//
//   node scripts/report-bundle-size.mjs bundle-size.json [bundle-size-main.json] > comment.md
import fs from 'node:fs'

const [currentFile, baselineFile] = process.argv.slice(2)
if (!currentFile) throw new Error('Usage: report-bundle-size.mjs <current.json> [baseline.json]')

const current = JSON.parse(fs.readFileSync(currentFile, 'utf8'))
const baseline = baselineFile && fs.existsSync(baselineFile) ? JSON.parse(fs.readFileSync(baselineFile, 'utf8')) : null

const packageRows = 15

const size = (bundle, before, name) => Math.max(bundle.packages[name] ?? 0, before?.packages[name] ?? 0)

function formatBytes(bytes) {
  if (Math.abs(bytes) >= 1e6) return `${(bytes / 1e6).toFixed(2)} MB`
  if (Math.abs(bytes) >= 1e3) return `${(bytes / 1e3).toFixed(1)} kB`
  return `${bytes} B`
}

/** A delta against the baseline, or `–` when there is nothing to compare against. */
function formatDelta(bytes, before) {
  if (before === undefined) return baseline ? '_new_' : '–'
  const delta = bytes - before
  if (delta === 0) return '–'
  const percentage = before === 0 ? '' : ` (${delta > 0 ? '+' : ''}${((delta / before) * 100).toFixed(1)}%)`
  return `${delta > 0 ? '+' : '-'}${formatBytes(Math.abs(delta))}${percentage}`
}

const lines = [
  '<!-- paradym-bundle-size -->',
  '## 📦 Bundle size',
  '',
  'Bytecode is what the binary ships — the JS column is the Metro output it is compiled from.',
  '',
  'Packages are listed by size on whichever side is larger, so one this branch drops still shows.',
  '',
  '| Bundle | Platform | Bytecode | vs main | JS | Modules |',
  '| --- | --- | --: | --: | --: | --: |',
]

for (const [key, bundle] of Object.entries(current.bundles)) {
  const before = baseline?.bundles[key]
  lines.push(
    `| ${bundle.label} | ${bundle.platform} | ${formatBytes(bundle.bytes.hermes)} | ${formatDelta(bundle.bytes.hermes, before?.bytes.hermes)} | ${formatBytes(bundle.bytes.js)} | ${bundle.moduleCount.toLocaleString('en-US')} |`
  )
}

for (const [key, bundle] of Object.entries(current.bundles)) {
  const before = baseline?.bundles[key]
  const names = [...new Set([...Object.keys(bundle.packages), ...Object.keys(before?.packages ?? {})])]
    // By whichever side is larger, so a package that was dropped entirely still shows up.
    .sort((a, b) => size(bundle, before, b) - size(bundle, before, a))
    .slice(0, packageRows)

  lines.push(
    '',
    `<details><summary>${bundle.label} (${bundle.platform}) — largest packages</summary>`,
    '',
    '| Package | JS | vs main |',
    '| --- | --: | --: |',
    ...names.map(
      (name) =>
        `| \`${name}\` | ${formatBytes(bundle.packages[name] ?? 0)} | ${formatDelta(bundle.packages[name] ?? 0, before?.packages[name])} |`
    ),
    '',
    '</details>'
  )
}

lines.push(
  '',
  baseline
    ? `Measured at \`${current.commit.slice(0, 7)}\`, compared against \`${baseline.commit.slice(0, 7)}\` on main (${baseline.generatedAt.slice(0, 10)}).`
    : `Measured at \`${current.commit.slice(0, 7)}\`. No baseline from main yet — the first run on main becomes one.`
)

console.log(lines.join('\n'))
