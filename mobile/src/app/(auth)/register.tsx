import React, { useEffect, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../providers/AuthProvider";
import ScreenHeader from "../../components/ui/ScreenHeader";
import AuthInput from "../../components/ui/AuthInput";
import PrimaryButton from "../../components/ui/PrimaryButton";
import FormErrorText from "../../components/ui/FormErrorText";
import SocialAuthButton from "../../components/ui/SocialAuthButton";
import { isAppleAuthAvailable } from "../../lib/auth/apple-signin";
import { PRIMARY, TEXT_SECONDARY, SURFACE, INACTIVE } from "../../constants/colors";

const PRIVACY_URL = "https://u-app-web-mvp.onrender.com/privacy";
const TERMS_URL = "https://u-app-web-mvp.onrender.com/privacy";

// Simple email validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const resp = (err as { response?: { data?: { message?: string; error?: string } } })
      .response;
    if (resp?.data?.message) return resp.data.message;
    if (resp?.data?.error) return resp.data.error;
  }
  if (err instanceof Error) return err.message;
  return "Đã xảy ra lỗi, vui lòng thử lại.";
}

export default function RegisterScreen(): React.JSX.Element {
  const router = useRouter();
  const auth = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    isAppleAuthAvailable().then(setAppleAvailable).catch(() => setAppleAvailable(false));
  }, []);

  // Inline validation
  const emailError =
    email.length > 0 && !isValidEmail(email) ? "Email không hợp lệ" : "";
  const passwordError =
    password.length > 0 && password.length < 8
      ? "Mật khẩu tối thiểu 8 ký tự"
      : "";
  const confirmError =
    confirmPassword.length > 0 && confirmPassword !== password
      ? "Mật khẩu không khớp"
      : "";

  const isFormValid =
    isValidEmail(email) &&
    password.length >= 8 &&
    confirmPassword === password &&
    termsAccepted;

  const handleRegister = async (): Promise<void> => {
    setServerError("");
    setLoading(true);
    try {
      await auth.register(email.trim(), password);
      // D-30: always go to complete-profile after register
      router.replace("/(auth)/complete-profile");
    } catch (err) {
      setServerError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader
        title="Tạo tài khoản"
        subtitle="Tham gia cộng đồng Ủ để bắt đầu hành trình sức khỏe"
        showBack
      />

      <View style={styles.form}>
        {/* D-32: No name field at register */}
        <AuthInput
          label="Email"
          placeholder="example@email.com"
          value={email}
          onChangeText={setEmail}
          leftIcon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          error={emailError}
        />

        <AuthInput
          label="Mật khẩu"
          placeholder="Tối thiểu 8 ký tự"
          value={password}
          onChangeText={setPassword}
          leftIcon="lock-closed-outline"
          secureTextEntry
          error={passwordError}
        />

        <AuthInput
          label="Xác nhận mật khẩu"
          placeholder="Nhập lại mật khẩu"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          leftIcon="lock-closed-outline"
          secureTextEntry
          error={confirmError}
        />

        {/* Terms checkbox */}
        <Pressable
          onPress={() => setTermsAccepted((prev) => !prev)}
          style={styles.termsRow}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: termsAccepted }}
        >
          <Ionicons
            name={termsAccepted ? "checkbox" : "square-outline"}
            size={22}
            color={termsAccepted ? PRIMARY : INACTIVE}
            style={styles.checkbox}
          />
          <Text style={styles.termsText}>
            Tôi đồng ý với{" "}
            <Text
              style={styles.termsLink}
              onPress={() => Linking.openURL(TERMS_URL)}
            >
              Điều khoản dịch vụ
            </Text>{" "}
            và{" "}
            <Text
              style={styles.termsLink}
              onPress={() => Linking.openURL(PRIVACY_URL)}
            >
              Chính sách bảo mật
            </Text>
          </Text>
        </Pressable>

        {serverError ? <FormErrorText message={serverError} /> : null}

        <PrimaryButton
          label="Đăng ký"
          onPress={handleRegister}
          loading={loading}
          disabled={!isFormValid}
        />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>hoặc</Text>
          <View style={styles.divider} />
        </View>

        {Platform.OS === "ios" && appleAvailable ? (
          <SocialAuthButton
            provider="apple"
            loading={oauthLoading === "apple"}
            onPress={async () => {
              setServerError("");
              setOauthLoading("apple");
              try {
                const user = await auth.loginWithApple();
                router.replace(user.profileCompleted ? "/(tabs)" : "/(auth)/complete-profile");
              } catch (err: any) {
                if (err?.code !== "ERR_REQUEST_CANCELED" && err?.message !== "CANCELLED") {
                  setServerError(err?.message ?? "Đăng nhập Apple thất bại. Vui lòng thử lại.");
                }
              } finally {
                setOauthLoading(null);
              }
            }}
          />
        ) : null}

        <View style={Platform.OS === "ios" && appleAvailable ? styles.socialGap : undefined}>
          <SocialAuthButton
            provider="google"
            loading={oauthLoading === "google"}
            onPress={async () => {
              setServerError("");
              setOauthLoading("google");
              try {
                const user = await auth.loginWithGoogle();
                router.replace(user.profileCompleted ? "/(tabs)" : "/(auth)/complete-profile");
              } catch (err: any) {
                if (err?.code !== "SIGN_IN_CANCELLED") {
                  setServerError(err?.message ?? "Đăng nhập Google thất bại. Vui lòng thử lại.");
                }
              } finally {
                setOauthLoading(null);
              }
            }}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Đã có tài khoản? </Text>
        <Pressable onPress={() => router.push("/(auth)/login")}>
          <Text style={styles.footerLink}>Đăng nhập</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  form: {
    marginTop: 32,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingRight: 8,
  },
  checkbox: {
    marginRight: 10,
    marginTop: 1,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: TEXT_SECONDARY,
    lineHeight: 20,
  },
  termsLink: {
    color: PRIMARY,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  socialGap: {
    marginTop: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 32,
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  footerLink: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: "700",
  },
});
