import {
  Button,
  FlexPage,
  Heading,
  Separator,
  XStack,
  YStack,
} from "@package/ui";
import React, { useState } from "react";
import Animated, { FadingTransition } from "react-native-reanimated";
import { LinearGradient } from "tamagui/linear-gradient";

export interface OnboardingWelcomeProps {
  goToNextStep: (selectedFlow: "c" | "bprime") => void;
}

export default function OnboardingWelcome({
  goToNextStep,
}: OnboardingWelcomeProps) {
  const [selectedFlow, setSelectedFlow] = useState<"c" | "bprime">("c");

  return (
    <Animated.View style={{ flex: 1 }} layout={FadingTransition}>
      <FlexPage p={0} safeArea={false}>
        <LinearGradient
          position="absolute"
          flex={1}
          width="100%"
          height="100%"
          colors={["$grey-100", "$white"]}
          start={[0.5, 0]}
          end={[0.5, 1]}
        />
        <YStack p="$4" gap="$4" flex-1 justifyContent="space-between">
          {/* This stack ensures the right spacing  */}
          <YStack flex={3} />
          <YStack gap="$2">
            <Heading variant="title">Ausweis Wallet</Heading>
            <Separator
              borderWidth={3}
              borderRadius={3}
              borderColor="$primary-500"
              width="$4"
            />
            <Heading variant="title" secondary>
              Your digital Identity
            </Heading>
          </YStack>
          <YStack flex-1 />
          <XStack gap="$2" my="$6">
            <Button.Outline
              p="$0"
              width="$buttonHeight"
              onPress={() =>
                setSelectedFlow(selectedFlow === "c" ? "bprime" : "c")
              }
            >
              <Heading variant="h2" color={"$primary-500"} fontWeight={"bold"}>
                {selectedFlow === "c" ? "C" : "B'"}
              </Heading>
            </Button.Outline>
            <Button.Solid
              flexGrow={1}
              onPress={() => goToNextStep(selectedFlow)}
            >
              Get Started
            </Button.Solid>
          </XStack>
        </YStack>
      </FlexPage>
    </Animated.View>
  );
}
