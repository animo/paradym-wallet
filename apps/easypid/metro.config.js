/**
 * @type {import('expo/metro-config')}
 */
const { getDefaultConfig } = require('@expo/metro-config')
const path = require('node:path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]
config.resolver.sourceExts = [...config.resolver.sourceExts, 'js', 'json', 'ts', 'tsx', 'cjs', 'mjs']
config.resolver.assetExts = [...config.resolver.assetExts, 'bin']
config.resolver.extraNodeModules = {
  // Needed for cosmjs trying to import node crypto
  crypto: require.resolve('./src/polyfills/crypto.ts'),
}

module.exports = config
