import path from 'node:path'
import { getDefaultConfig, type MetroConfig } from '@expo/metro-config'

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

    // expo-router exports its web route context under the `browser` condition, which leaves `+native-intent`
    // out on native. Resolve it without that condition there.
    resolveRequest: ((context, moduleName, platform) => {
      if (moduleName === 'expo-router/_ctx' && platform !== 'web') {
        return context.resolveRequest(
          {
            ...context,
            unstable_conditionNames: context.unstable_conditionNames.filter((condition) => condition !== 'browser'),
          },
          moduleName,
          platform
        )
      }

      return context.resolveRequest(context, moduleName, platform)
    }) satisfies NonNullable<MetroConfig['resolver']>['resolveRequest'],
  },
}
