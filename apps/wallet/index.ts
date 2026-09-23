import 'expo-router/entry'
import { registerCatalogs } from '@package/translations'
import { catalogs } from './src/locales'

// Register translations. The catalog for the active locale is loaded when it is activated.
registerCatalogs(catalogs)
