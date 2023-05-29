import { Icon, config } from '@internal/ui'
import { BlurView } from '@react-native-community/blur'
import { Tabs } from 'expo-router'

const HEADER_STATUS_BAR_HEIGHT = 56

export default () => {
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
            reducedTransparencyFallbackColor={config.themes.light.white as unknown as string}
            style={{ height: '100%' }}
          />
        ),
      }}
    >
      <Tabs.Screen
        options={{
          tabBarIcon: ({ focused }) => <Icon name="Wallet" filled={focused} />,
          headerTransparent: true,
          headerTitle: '',
          headerBackgroundContainerStyle: {
            height: HEADER_STATUS_BAR_HEIGHT,
            backgroundColor: config.themes.light['grey-200'] as unknown as string,
          },
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
