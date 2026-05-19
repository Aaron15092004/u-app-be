import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TEXT, TEXT_SECONDARY } from '../../constants/colors';

interface FAQItemProps {
  question: string;
  answer: string;
}

export default function FAQItem({
  question,
  answer,
}: FAQItemProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.header,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.question}>{question}</Text>
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={18}
          color={TEXT_SECONDARY}
        />
      </Pressable>
      {expanded && (
        <Text style={styles.answer}>{answer}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  question: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
    flex: 1,
    marginRight: 8,
  },
  answer: {
    fontSize: 16,
    fontWeight: '400',
    color: TEXT_SECONDARY,
    paddingTop: 8,
    paddingBottom: 8,
  },
});
