// The native build reads Reanimated's static feature flags from package.json,
// which the fingerprint doesn't hash, so add them as a source.
const { reanimated } = require('./package.json')

/** @type {import('expo/fingerprint').Config} */
module.exports = {
  extraSources: [
    {
      type: 'contents',
      id: 'reanimatedStaticFeatureFlags',
      contents: JSON.stringify(reanimated ?? {}),
      reasons: ['reanimatedStaticFeatureFlags'],
    },
    // pnpm applies the patches in the repo root `patches/` dir (patchedDependencies) to native packages too.
    // The fingerprint only looks for a `patches/` dir in the project root, so add the repo root one.
    {
      type: 'dir',
      filePath: '../../patches',
      reasons: ['pnpmPatches'],
    },
  ],
}
