import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { PRIMARY, TEXT, TEXT_SECONDARY } from '../../constants/colors';

interface NotifToggleRowProps {
  label: string;
  sublabel: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export default function NotifToggleRow({
  label,
  sublabel,
  value,
  onChange,
}: NotifToggleRowProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.sublabel}>{sublabel}</Text>
      </View>
      <Switch
        trackColor={{ false: '#E0E0E0', true: PRIMARY }}
        thumbColor="#FFFFFF"
        value={value}
        onValueChange={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
  },
  sublabel: {
    fontSize: 12,
    fontWeight: '400',
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
});
