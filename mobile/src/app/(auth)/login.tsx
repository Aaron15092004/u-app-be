import React, { useState, useEffect } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../providers/AuthProvider";
import ScreenHeader from "../../components/ui/ScreenHeader";
import AuthInput from "../../components/ui/AuthInput";
import PrimaryButton from "../../components/ui/PrimaryButton";
import FormErrorText from "../../components/ui/FormErrorText";
import SocialAuthButton from "../../components/ui/SocialAuthButton";
import { isAppleAuthAvailable } from "../../lib/auth/apple-signin";
import { PRIMARY, TEXT_SECONDARY, SURFACE, BORDER_DEFAULT } from "../../constants/colors";

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

export default function LoginScreen(): React.JSX.Element {
  const router = useRouter();
  const auth = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(
    null,
  );
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    isAppleAuthAvailable().then(setAppleAvailable);
  }, []);

  const handleLogin = async (): Promise<void> => {
    setServerError("");
    setLoading(true);
    try {
      const user = await auth.login(email.trim(), password);
      if (user.profileCompleted) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/complete-profile");
      }
    } catch (err) {
      setServerError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email.trim().length > 0 && password.length > 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader
        title="Đăng nhập"
        subtitle="Chào mừng trở lại! Tiếp tục hành trình sức khỏe của bạn"
        showBack
      />

      <View style={styles.form}>
        <AuthInput
          label="Email"
          placeholder="example@email.com"
          value={email}
          onChangeText={setEmail}
          leftIcon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <AuthInput
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          value={password}
          onChangeText={setPassword}
          leftIcon="lock-closed-outline"
          secureTextEntry
        />

        <Pressable
          onPress={() => router.push("/(auth)/forgot-password")}
          style={styles.forgotPassword}
        >
          <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
        </Pressable>

        {serverError ? <FormErrorText message={serverError} /> : null}

        <PrimaryButton
          label="Đăng nhập"
          onPress={handleLogin}
          loading={loading}
          disabled={!isFormValid}
        />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>hoặc</Text>
          <View style={styles.divider} />
        </View>

        {Platform.OS === "ios" && appleAvailable && (
          <View style={styles.socialButton}>
            <SocialAuthButton
              provider="apple"
              loading={oauthLoading === "apple"}
              onPress={async () => {
                setOauthLoading("apple");
                try {
                  const user = await auth.loginWithApple();
                  if (!user.profileCompleted)
                    router.replace("/(auth)/complete-profile");
                  else router.replace("/(tabs)");
                } catch (err: any) {
                  if (err?.message !== "CANCELLED")
                    setServerError(
                      "Đăng nhập Apple thất bại. Vui lòng thử lại.",
                    );
                } finally {
                  setOauthLoading(null);
                }
              }}
            />
          </View>
        )}

        <View style={Platform.OS === "ios" && appleAvailable ? styles.socialButton : undefined}>
          <SocialAuthButton
            provider="google"
            loading={oauthLoading === "google"}
            onPress={async () => {
              setOauthLoading("google");
              try {
                const user = await auth.loginWithGoogle();
                if (!user.profileCompleted)
                  router.replace("/(auth)/complete-profile");
                else router.replace("/(tabs)");
              } catch (err: any) {
                console.warn("[GoogleLogin]", {
                  code: err?.code,
                  message: err?.message,
                  response: err?.response?.data,
                });
                if (err?.code !== "SIGN_IN_CANCELLED")
                  setServerError(
                    err?.message ?? "Đăng nhập Google thất bại. Vui lòng thử lại.",
                  );
              } finally {
                setOauthLoading(null);
              }
            }}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Chưa có tài khoản? </Text>
        <Pressable onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.footerLink}>Đăng ký ngay</Text>
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
  forgotPassword: {
    alignSelf: "flex-start",
    marginTop: -8,
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 14,
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
    backgroundColor: BORDER_DEFAULT,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  socialButton: { marginTop: 12 },
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
