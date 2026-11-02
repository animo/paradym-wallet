// Before anything imports Tamagui: presses on Tamagui components go through react-native-gesture-handler, so only the
// innermost of nested pressables fires.
import '@tamagui/native/setup-gesture-handler'
import 'expo-router/entry'
import { registerCatalogs } from '@package/translations'
import { catalogs } from './src/locales'

// Register translations. The catalog for the active locale is loaded when it is activated.
registerCatalogs(catalogs)
