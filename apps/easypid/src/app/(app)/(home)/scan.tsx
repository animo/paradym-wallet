import { QrScannerScreen, isAndroid } from '@package/app'
import * as NavigationBar from 'expo-navigation-bar'
import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import { credentialDataHandlerOptions } from '../_layout'

export default function Screen() {
  // make the navigation bar light when the camera scanner is open
  useFocusEffect(
    useCallback(() => {
      if (isAndroid()) {
        void NavigationBar.setButtonStyleAsync('light')
        return () => {
          void NavigationBar.setButtonStyleAsync('dark')
        }
      }
    }, [])
  )

  return <QrScannerScreen credentialDataHandlerOptions={{ ...credentialDataHandlerOptions, routeMethod: 'replace' }} />
}
