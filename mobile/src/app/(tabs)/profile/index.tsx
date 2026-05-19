import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../providers/AuthProvider';
import { getProfileStatsApi } from '../../../lib/api/users.api';
import { getStreakApi } from '../../../lib/api/habits.api';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import AchievementBadgesRow from '../../../components/ui/AchievementBadgesRow';
import ProfileMenuCard from '../../../components/ui/ProfileMenuCard';
import ProfileMenuRow from '../../../components/ui/ProfileMenuRow';
import {
  PRIMARY,
  BACKGROUND,
  SURFACE,
  TEXT,
  TEXT_SECONDARY,
  STREAK_BADGE,
} from '../../../constants/colors';

export default function ProfileScreen(): React.JSX.Element {
  const auth = useAuth();
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);

  const statsQuery = useQuery({
    queryKey: ['users', 'profile', 'stats'],
    queryFn: getProfileStatsApi,
  });

  const streakQuery = useQuery({
    queryKey: ['habits', 'streak'],
    queryFn: getStreakApi,
  });

  const confirmLogout = (): void => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất không?',
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
      ],
    );
  };

  const userName = auth.user?.name ?? '';
  const userEmail = auth.user?.email ?? '';
  const streakDays = streakQuery.data?.streakDays ?? 0;
  const totalWorkouts = statsQuery.data?.totalWorkouts;
  const totalKcalBurned = statsQuery.data?.totalKcalBurned;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Avatar + name + email */}
        <View style={styles.avatarBlock}>
          {/* Avatar: initial letter placeholder (no avatar field in IAuthUser) */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {userName.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>

        {/* 2. Stats row */}
        <View style={styles.statsCard}>
          {/* Streak */}
          <View style={styles.statsCol}>
            <View style={styles.statsValueRow}>
              <Ionicons name="flame-outline" size={16} color={STREAK_BADGE} />
              <Text style={styles.statsValue}>
                {statsQuery.data?.streakDays ?? '—'}
              </Text>
            </View>
            <Text style={styles.statsLabel}>ngày streak</Text>
          </View>
          <View style={styles.statsDivider} />
          {/* Workouts */}
          <View style={styles.statsCol}>
            <Text style={styles.statsValue}>
              {totalWorkouts ?? '—'}
            </Text>
            <Text style={styles.statsLabel}>bài tập</Text>
          </View>
          <View style={styles.statsDivider} />
          {/* Kcal */}
          <View style={styles.statsCol}>
            <Text style={styles.statsValue}>
              {totalKcalBurned ?? '—'}
            </Text>
            <Text style={styles.statsLabel}>kcal đốt</Text>
          </View>
        </View>

        {/* Error state for stats */}
        {statsQuery.isError && (
          <View style={styles.errorCard}>
            <Ionicons name="warning-outline" size={16} color="#FFA726" />
            <Text style={styles.errorText}>Lỗi tải thống kê</Text>
            <Pressable
              onPress={() => { void statsQuery.refetch(); }}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Thử lại</Text>
            </Pressable>
          </View>
        )}

        {/* 3. Achievement badges */}
        <View style={styles.section}>
          <AchievementBadgesRow streakDays={streakDays} />
        </View>

        {/* 4. Menu card */}
        <View style={styles.section}>
          <ProfileMenuCard>
            <ProfileMenuRow
              iconName="create-outline"
              label="Chỉnh sửa hồ sơ"
              onPress={() => router.push('/(tabs)/profile/edit')}
            />
            <ProfileMenuRow
              iconName="notifications-outline"
              label="Cài đặt thông báo"
              onPress={() => router.push('/(tabs)/profile/notifications')}
            />
            <ProfileMenuRow
              iconName="help-circle-outline"
              label="Trợ giúp & Hỗ trợ"
              onPress={() => router.push('/(tabs)/profile/help')}
            />
          </ProfileMenuCard>
        </View>

        {/* 5. Logout button */}
        <View style={styles.section}>
          <PrimaryButton
            variant="outlined"
            label="Đăng xuất"
            loading={logoutLoading}
            onPress={confirmLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 48,
  },
  // Avatar block
  avatarBlock: {
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT,
    marginTop: 12,
  },
  email: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    marginTop: 4,
  },
  // Stats row
  statsCard: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    flexDirection: 'row',
    marginTop: 24,
  },
  statsCol: {
    flex: 1,
    alignItems: 'center',
  },
  statsValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT,
  },
  statsLabel: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 4,
    textAlign: 'center',
  },
  statsDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    alignSelf: 'stretch',
    marginVertical: 4,
  },
  // Error
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 12,
    backgroundColor: SURFACE,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(76,175,80,0.1)',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
  },
  // Section spacing
  section: {
    marginTop: 16,
  },
});
