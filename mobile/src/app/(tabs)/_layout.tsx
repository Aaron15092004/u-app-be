import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PRIMARY, TEXT_SECONDARY } from '../../constants/colors';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: PRIMARY, tabBarInactiveTintColor: TEXT_SECONDARY, headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Tập luyện',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'barbell' : 'barbell-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Thói quen',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bmi"
        options={{
          title: 'BMI',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'body' : 'body-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
