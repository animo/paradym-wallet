import * as NavigationBar from 'expo-navigation-bar'

export default function useTransparentNavigationBar() {
  void NavigationBar.setPositionAsync('absolute')
  void NavigationBar.setBackgroundColorAsync('#ffffff01')
}
