/** @type {import('expo/fingerprint').Config} */
module.exports = {
  extraSources: [
    // pnpm applies the patches in the repo root `patches/` dir (patchedDependencies) to native packages too.
    // The fingerprint only looks for a `patches/` dir in the project root, so add the repo root one.
    {
      type: 'dir',
      filePath: '../../patches',
      reasons: ['pnpmPatches'],
    },
  ],
}
