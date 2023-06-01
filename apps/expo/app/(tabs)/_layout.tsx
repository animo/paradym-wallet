import { Icon, Heading } from '@internal/ui'
import { BlurView } from '@react-native-community/blur'
import { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default () => {
  // FIXME: As we only have one actual tab, and the scanner, it might be better to remove the tab bar for now.
  const { top } = useSafeAreaInsets()
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          position: 'absolute',
          left: 0,
          bottom: 0,
          elevation: 0,
          borderTopWidth: 0,
        },
        tabBarBackground: () => (
          <BlurView
            blurAmount={25}
            blurType="light"
            reducedTransparencyFallbackColor="#fff"
            style={{ height: '100%' }}
          />
        ),
      }}
    >
      <Tabs.Screen
        options={{
          tabBarIcon: ({ focused }) => <Icon name="Wallet" filled={focused} />,
          header: () => (
            <Heading variant="title" t={top}>
              Wallet
            </Heading>
          ),
        }}
        name="wallet"
      />
      <Tabs.Screen
        options={{
          tabBarIcon: ({ focused }) => <Icon name="Scan" filled={focused} />,
          headerShown: false,
        }}
        name="scan"
      />
    </Tabs>
  )
}
