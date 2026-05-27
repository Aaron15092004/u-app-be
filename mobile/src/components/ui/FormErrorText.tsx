import React from "react";
import Animated, { FadeInDown } from "react-native-reanimated";

interface FormErrorTextProps {
  message: string;
}

export default function FormErrorText({
  message,
}: FormErrorTextProps): React.JSX.Element | null {
  if (!message) {
    return null;
  }

  return (
    <Animated.Text
      entering={FadeInDown.duration(100)}
      style={{
        fontSize: 12,
        color: "#B71C1C",
        marginTop: 4,
      }}
    >
      {message}
    </Animated.Text>
  );
}
