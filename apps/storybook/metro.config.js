/**
 * @type {import('expo/metro-config')}
 */
const { getDefaultConfig } = require('expo/metro-config')
const path = require('node:path')
const { generate } = require('@storybook/react-native/scripts/generate')

generate({
  configPath: path.resolve(__dirname, './.ondevice'),
})

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')
const config = getDefaultConfig(__dirname)

config.transformer.unstable_allowRequireContext = true
config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = config
