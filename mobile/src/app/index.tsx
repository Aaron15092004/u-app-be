import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api/client';
import { HealthCheckResponse } from '../types/api.types';
import { PRIMARY } from '../constants/colors';
import { registerPushToken } from '../lib/notifications/push-token';

async function fetchHealthCheck(): Promise<HealthCheckResponse> {
  const response = await apiClient.get<{ success: boolean; data: HealthCheckResponse }>('/api/health');
  return response.data.data;
}

export default function HealthCheckScreen(): React.JSX.Element {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealthCheck,
    retry: 1,
  });

  const [pushTokenStatus, setPushTokenStatus] = useState<'pending' | 'registered' | 'failed'>('pending');

  useEffect(() => {
    registerPushToken(apiClient).then((result) => {
      setPushTokenStatus(result.success ? 'registered' : 'failed');
    });
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={PRIMARY} size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Không thể kết nối backend</Text>
        <TouchableOpacity style={styles.button} onPress={() => refetch()}>
          <Text style={styles.buttonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pushLabel =
    pushTokenStatus === 'registered'
      ? 'Registered'
      : pushTokenStatus === 'failed'
      ? 'Failed (check logs)'
      : 'Registering...';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Walking Skeleton — Phase 1</Text>
      <Text style={styles.row}>Backend: {data?.status === 'ok' ? 'OK' : data?.status}</Text>
      <Text style={styles.row}>Database: {data?.db}</Text>
      <Text style={styles.row}>DB Write: {data?.dbWrite ? 'OK' : 'FAILED'}</Text>
      <Text style={styles.row}>Cloudinary: {data?.cloudinary ? 'OK' : 'Not configured'}</Text>
      <Text style={styles.row}>Firebase: {data?.firebase ? 'Configured' : 'Not configured'}</Text>
      <Text style={styles.row}>Push Token: {pushLabel}</Text>
      <TouchableOpacity style={styles.button} onPress={() => refetch()}>
        <Text style={styles.buttonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 24,
    color: '#212121',
  },
  row: {
    fontSize: 16,
    marginVertical: 4,
    color: '#212121',
  },
  error: {
    fontSize: 16,
    color: 'red',
    marginBottom: 16,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
