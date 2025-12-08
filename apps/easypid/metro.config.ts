import path from 'node:path'
import { getDefaultConfig } from '@expo/metro-config'

const projectRoot = import.meta.dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

export default {
  ...config,
  watchFolders: [workspaceRoot],
  resolver: {
    ...config.resolver,

    nodeModulesPaths: [path.resolve(projectRoot, 'node_modules'), path.resolve(workspaceRoot, 'node_modules')],
    sourceExts: [...(config.resolver?.sourceExts ?? []), 'js', 'json', 'ts', 'tsx', 'cjs', 'mjs'],
    extraNodeModules: {
      // Needed for cosmjs trying to import node crypto
      crypto: import.meta.resolve('./src/polyfills/crypto.ts'),
    },

    // Needed to import cheqd
    unstable_enablePackageExports: true,
    unstable_conditionNames: ['require', 'react-native', 'browser', 'default'],
  },
}
