// TODO Phase 3+: add all 5 tabs (Home, Meals, Workouts, Habits, Profile)
import React from 'react';
import { Tabs } from 'expo-router';
import { PRIMARY } from '../../constants/colors';

export default function TabsLayout(): React.JSX.Element {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: PRIMARY }}>
      <Tabs.Screen name="index" options={{ title: 'Trang chủ' }} />
    </Tabs>
  );
}
