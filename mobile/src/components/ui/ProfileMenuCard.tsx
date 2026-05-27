import React from "react";
import { StyleSheet, View } from "react-native";

interface ProfileMenuCardProps {
  children: React.ReactNode;
}

export default function ProfileMenuCard({
  children,
}: ProfileMenuCardProps): React.JSX.Element {
  const childArray = React.Children.toArray(children);

  return (
    <View style={styles.card}>
      {childArray.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < childArray.length - 1 && <View style={styles.divider} />}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 16,
  },
});
