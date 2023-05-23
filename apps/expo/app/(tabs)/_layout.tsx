import { Icon, PageTitle, XStack, borderRadiusSizes, paddingSizes } from '@internal/ui/src'
import { Tabs } from 'expo-router'

export default () => {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          height: '10%',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
          position: 'absolute',
          borderTopWidth: 0,
          alignContent: 'center',
        },
        tabBarBackground: () => (
          <XStack
            f={1}
            backgroundColor="$grey-300"
            py={paddingSizes.xl}
            borderTopRightRadius={borderRadiusSizes.xl}
            borderTopLeftRadius={borderRadiusSizes.xl}
          />
        ),
      }}
    >
      <Tabs.Screen
        options={{
          tabBarIcon: ({ focused }) => <Icon name="Wallet" filled={focused} />,
          header: () => <PageTitle>Wallet</PageTitle>,
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
