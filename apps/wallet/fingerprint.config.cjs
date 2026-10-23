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
  ],
}
