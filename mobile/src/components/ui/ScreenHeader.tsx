import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export default function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
}: ScreenHeaderProps): React.JSX.Element {
  const router = useRouter();
  const canGoBack = router.canGoBack();

  return (
    <View style={styles.container}>
      {showBack && canGoBack ? (
        <Pressable
          onPress={() => (onBack ? onBack() : router.back())}
          accessibilityLabel="Quay lại"
          accessibilityRole="button"
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#212121" />
        </Pressable>
      ) : null}

      <Text style={styles.title}>{title}</Text>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212121",
    marginTop: 32,
  },
  subtitle: {
    fontSize: 16,
    color: "#757575",
    marginTop: 8,
  },
});
