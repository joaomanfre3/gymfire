import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function SheetDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 4,
  },
});
