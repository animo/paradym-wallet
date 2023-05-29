import { Icon } from '@internal/ui'
import { BlurView } from '@react-native-community/blur'
import { Tabs } from 'expo-router'

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
            reducedTransparencyFallbackColor="#fff"
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
            height: 56,
            backgroundColor: '#F2F4F6',
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
