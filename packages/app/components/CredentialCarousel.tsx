import { getCredentialForDisplay, type W3cCredentialRecord } from '@internal/agent'
import { XStack, YStack } from '@internal/ui'
import * as React from 'react'
import { useState } from 'react'
import { Dimensions } from 'react-native'
import Carousel from 'react-native-reanimated-carousel'
import { useRouter } from 'solito/router'

import CredentialCard from 'app/components/CredentialCard'

interface CarouselProps {
  credentials: W3cCredentialRecord[]
}

export function CredentialCarousel({ credentials }: CarouselProps) {
  const { push } = useRouter()

  const [selectedItemIdx, setSelectedItemIdx] = useState(0)
  const width = Dimensions.get('window').width

  const navigateToCredentialDetail = (id: string) => push(`/credentials/${id}`)

  return (
    <YStack flex-1>
      <Carousel
        loop={false}
        width={width}
        height={width / 1.75}
        data={credentials}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 1,
          parallaxScrollingOffset: 24,
        }}
        scrollAnimationDuration={1000}
        onSnapToItem={(index) => setSelectedItemIdx(index)}
        renderItem={({ item }) => {
          const { display } = getCredentialForDisplay(item)
          return (
            <XStack maxWidth={width / 1.1}>
              <CredentialCard
                onPress={() => navigateToCredentialDetail(item.id)}
                issuerImage={display.issuer.logo}
                textColor={display.textColor}
                name={display.name}
                issuerName={display.issuer.name}
                backgroundImage={display.backgroundImage}
                subtitle={display.description}
                bgColor={display.backgroundColor}
                shadow={false}
              />
            </XStack>
          )
        }}
      />
      <XStack gap="$2" jc="center">
        {credentials.map((c, idx) => (
          <YStack
            key={c.id}
            br="$12"
            bg={selectedItemIdx === idx ? '$grey-900' : '$grey-300'}
            h="$0.75"
            w="$0.75"
          />
        ))}
      </XStack>
    </YStack>
  )
}
