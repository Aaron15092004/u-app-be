import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { SURFACE, TEXT } from "../../constants/colors";

interface HomeSectionProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function HomeSection({
  title,
  children,
  style,
}: HomeSectionProps): React.JSX.Element {
  return (
    <View style={[styles.section, style]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {},
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 12,
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
});
