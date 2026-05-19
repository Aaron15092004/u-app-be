import React, { useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import PrimaryButton from './PrimaryButton';
import { registerTokenApi } from '../../lib/api/notifications.api';
import {
  PRIMARY,
  SURFACE,
  TEXT,
  STREAK_BADGE,
} from '../../constants/colors';

interface NotificationRationaleModalProps {
  visible: boolean;
  onAccept: () => Promise<void>;
  onDismiss: () => void;
}

export default function NotificationRationaleModal({
  visible,
  onAccept,
  onDismiss,
}: NotificationRationaleModalProps): React.JSX.Element {
  const [loading, setLoading] = useState(false);

  const handleEnable = async (): Promise<void> => {
    setLoading(true);
    try {
      const { granted } = await Notifications.requestPermissionsAsync();
      if (granted) {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
          });
        }
        const tokenData = await Notifications.getDevicePushTokenAsync();
        if (tokenData?.data) {
          await registerTokenApi(
            tokenData.data,
            Platform.OS === 'ios' ? 'ios' : 'android',
          );
        }
      }
    } catch (err) {
      console.warn('[NotificationRationaleModal] permission flow error:', err);
    } finally {
      setLoading(false);
      await onAccept();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        {/* Icon */}
        <Ionicons
          name="notifications-outline"
          size={80}
          color={PRIMARY}
          style={styles.icon}
        />

        {/* Title */}
        <Text style={styles.title}>Nhận nhắc nhở sức khỏe</Text>

        {/* Bullets */}
        <View style={styles.bullets}>
          <View style={styles.bulletRow}>
            <Ionicons name="water-outline" size={16} color="#64B5F6" />
            <Text style={styles.bulletText}>
              Nhắc uống nước đúng giờ mỗi ngày
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Ionicons name="barbell-outline" size={16} color={PRIMARY} />
            <Text style={styles.bulletText}>
              Nhắc bắt đầu buổi tập của bạn
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Ionicons name="flame-outline" size={16} color={STREAK_BADGE} />
            <Text style={styles.bulletText}>
              Cảnh báo khi bạn sắp mất streak
            </Text>
          </View>
        </View>

        {/* CTAs */}
        <View style={styles.ctas}>
          <PrimaryButton
            variant="filled"
            label="Bật thông báo"
            loading={loading}
            onPress={() => { void handleEnable(); }}
          />
          <View style={styles.ctaGap} />
          <PrimaryButton
            variant="outlined"
            label="Để sau"
            onPress={onDismiss}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT,
    textAlign: 'center',
    marginBottom: 12,
  },
  bullets: {
    width: '100%',
    marginTop: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bulletText: {
    fontSize: 16,
    color: TEXT,
    flex: 1,
  },
  ctas: {
    width: '100%',
    marginTop: 32,
  },
  ctaGap: {
    height: 12,
  },
});
