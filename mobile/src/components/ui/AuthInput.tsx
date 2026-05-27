import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FormErrorText from "./FormErrorText";
import {
  PRIMARY,
  BORDER_DEFAULT,
  BORDER_ERROR,
  TEXT,
  TEXT_SECONDARY,
} from "../../constants/colors";

interface AuthInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  leftIcon?: string; // Ionicons glyph name
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  unitLabel?: string;
  autoCapitalize?: TextInputProps["autoCapitalize"];
}

export default function AuthInput({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  leftIcon,
  secureTextEntry = false,
  keyboardType,
  unitLabel,
  autoCapitalize,
}: AuthInputProps): React.JSX.Element {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(false);

  const hasError = Boolean(error);
  const isSecure = secureTextEntry && !isSecureVisible;

  const borderColor = hasError
    ? BORDER_ERROR
    : isFocused
      ? PRIMARY
      : BORDER_DEFAULT;

  const borderWidth = isFocused && !hasError ? 2 : 1;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, { borderColor, borderWidth }]}>
        {leftIcon ? (
          <Ionicons
            name={leftIcon as React.ComponentProps<typeof Ionicons>["name"]}
            size={20}
            color={TEXT_SECONDARY}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            unitLabel ? styles.inputWithUnit : null,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {unitLabel ? <Text style={styles.unitLabel}>{unitLabel}</Text> : null}

        {secureTextEntry ? (
          <Pressable
            onPress={() => setIsSecureVisible((prev) => !prev)}
            accessibilityLabel={
              isSecureVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"
            }
            style={styles.eyeButton}
          >
            <Ionicons
              name={isSecureVisible ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={TEXT_SECONDARY}
            />
          </Pressable>
        ) : null}
      </View>

      {hasError ? <FormErrorText message={error!} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    position: "relative",
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: TEXT,
    padding: 0, // remove default Android padding
  },
  inputWithLeftIcon: {
    // already handled by leftIcon marginRight
  },
  inputWithUnit: {
    paddingRight: 40,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 4,
  },
  unitLabel: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginLeft: 4,
  },
});
