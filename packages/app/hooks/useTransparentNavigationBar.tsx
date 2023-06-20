import * as NavigationBar from 'expo-navigation-bar'

export const useTransparentNavigationBar = () => {
  void NavigationBar.setPositionAsync('absolute')
  void NavigationBar.setBackgroundColorAsync('#ffffff01')
}
