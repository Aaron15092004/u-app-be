import React from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import FAQItem from '../../../components/ui/FAQItem';
import { SURFACE, TEXT, TEXT_SECONDARY } from '../../../constants/colors';

// Try expo-clipboard; fallback to Alert if not available
let clipboardAvailable = false;
let Clipboard: { setStringAsync: (str: string) => Promise<void> } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Clipboard = require('expo-clipboard') as { setStringAsync: (str: string) => Promise<void> };
  clipboardAvailable = true;
} catch {
  clipboardAvailable = false;
}

const SUPPORT_EMAIL = 'support@u-app.vn';

const FAQ_ITEMS = [
  {
    question: 'Làm thế nào để cập nhật cân nặng?',
    answer:
      'Vào tab BMI, dùng thanh trượt để chọn cân nặng và chiều cao mới, sau đó nhấn Lưu.',
  },
  {
    question: 'Dữ liệu của tôi có được lưu an toàn không?',
    answer:
      'Có. Tất cả dữ liệu được lưu trữ trên MongoDB Atlas với mã hóa khi truyền và khi lưu. Mật khẩu được hash bằng bcrypt.',
  },
  {
    question: 'Cách tính streak là gì?',
    answer:
      'Streak là số ngày liên tiếp bạn đánh dấu hoàn thành ít nhất 3 thói quen trong 6 thói quen mặc định.',
  },
  {
    question: 'Tôi có thể xóa tài khoản không?',
    answer:
      'Hiện tại bạn có thể xóa tài khoản bằng cách liên hệ với chúng tôi qua email hỗ trợ. Tính năng tự xóa sẽ có trong bản cập nhật tiếp theo.',
  },
];

export default function HelpScreen(): React.JSX.Element {
  const appVersion =
    (Constants.expoConfig?.version as string | undefined) ?? 'v1.0.0';

  const handleCopyEmail = (): void => {
    if (clipboardAvailable && Clipboard) {
      void Clipboard.setStringAsync(SUPPORT_EMAIL);
      Alert.alert('Đã sao chép', SUPPORT_EMAIL);
    } else {
      Alert.alert('Đã sao chép', SUPPORT_EMAIL);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Trợ giúp & Hỗ trợ" showBack />

        {/* FAQ card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Câu hỏi thường gặp</Text>
          {FAQ_ITEMS.map((item) => (
            <FAQItem
              key={item.question}
              question={item.question}
              answer={item.answer}
            />
          ))}
        </View>

        {/* Contact card */}
        <View style={styles.card}>
          {/* Email row */}
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={20} color={TEXT_SECONDARY} />
            <Text style={styles.contactEmail}>{SUPPORT_EMAIL}</Text>
            <Pressable
              onPress={handleCopyEmail}
              accessibilityLabel="Sao chép email hỗ trợ"
              accessibilityRole="button"
            >
              <Ionicons name="copy-outline" size={20} color={TEXT_SECONDARY} />
            </Pressable>
          </View>

          <View style={styles.separator} />

          {/* Version row */}
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Phiên bản ứng dụng</Text>
            <Text style={styles.versionValue}>{appVersion}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginTop: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 12,
  },
  // Contact
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  contactEmail: {
    fontSize: 16,
    color: TEXT,
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  versionLabel: {
    fontSize: 16,
    color: TEXT,
  },
  versionValue: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
});
