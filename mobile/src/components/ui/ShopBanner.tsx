import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

interface ShopBannerProps {
  url: string | null;
  isLoading: boolean;
}

export default function ShopBanner({ url, isLoading }: ShopBannerProps): React.JSX.Element | null {
  if (url === null && !isLoading) {
    return null;
  }

  const handlePress = (): void => {
    if (url) {
      void Linking.openURL(url);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      disabled={!url}
      accessibilityRole="button"
      accessibilityLabel="Mở Ủ Shop"
      style={styles.wrapper}
    >
      <LinearGradient
        colors={['#4CAF50', '#388E3C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <View style={styles.leftContent}>
          <Ionicons name="storefront-outline" size={28} color="#FFFFFF" style={styles.icon} />
          <View style={styles.textBlock}>
            <Text style={styles.heading}>Ủ Shop</Text>
            <Text style={styles.subtext}>Khám phá sản phẩm sức khỏe</Text>
          </View>
        </View>
        {!isLoading && url ? (
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        ) : null}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  textBlock: {
    flex: 1,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtext: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.85)',
  },
});
