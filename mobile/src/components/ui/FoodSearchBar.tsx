import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FoodSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function FoodSearchBar({
  value,
  onChangeText,
  placeholder = 'Tìm theo tên món ăn...',
}: FoodSearchBarProps): React.JSX.Element {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        isFocused ? styles.containerFocused : styles.containerBlurred,
      ]}
    >
      <Ionicons name="search-outline" size={20} color="#757575" />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#BDBDBD"
        returnKeyType="search"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  containerBlurred: {
    borderColor: '#E0E0E0',
  },
  containerFocused: {
    borderColor: '#4CAF50',
  },
  input: {
    flex: 1,
    paddingLeft: 8,
    fontSize: 16,
    color: '#212121',
  },
});
