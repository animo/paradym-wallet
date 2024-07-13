import * as NavigationBar from 'expo-navigation-bar'

import { isAndroid } from '../utils/platform'

export const useTransparentNavigationBar = () => {
  if (isAndroid()) {
    void NavigationBar.setPositionAsync('absolute')
    void NavigationBar.setBackgroundColorAsync('#ffffff01')
  }
}
