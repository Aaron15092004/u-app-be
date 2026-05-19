import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import PrimaryButton from '../../components/ui/PrimaryButton';

// Tabs home — Phase 3 will replace this with the full dashboard
export default function TabsHome(): React.JSX.Element {
  const auth = useAuth();
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);

  const confirmLogout = (): void => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            setLogoutLoading(true);
            await auth.logout();
            setLogoutLoading(false);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Trang chủ — Phase 3 sắp ra mắt</Text>
      <View style={styles.logoutWrapper}>
        <PrimaryButton
          variant="outlined"
          label="Đăng xuất"
          onPress={confirmLogout}
          loading={logoutLoading}
        />
      </View>

      {/* D-69: Temp navigation buttons — Phase 5 will remove these when home dashboard is built */}
      <View style={styles.navButtonWrapper}>
        <PrimaryButton
          variant="filled"
          label="Quét bữa ăn"
          onPress={() => router.push('/(food)/scan')}
        />
      </View>
      <View style={styles.navButtonWrapperSecondary}>
        <PrimaryButton
          variant="outlined"
          label="Nhật ký ăn"
          onPress={() => router.push('/(food)/diary')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    padding: 24,
  },
  text: {
    fontSize: 16,
    color: '#212121',
    marginBottom: 32,
  },
  logoutWrapper: {
    width: '100%',
  },
  navButtonWrapper: {
    width: '100%',
    marginTop: 12,
  },
  navButtonWrapperSecondary: {
    width: '100%',
    marginTop: 8,
  },
});
