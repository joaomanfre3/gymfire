import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../../theme';

interface Props {
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
}

export default function ShareButton({ onPress, disabled, loading }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.btn, (disabled || loading) && { opacity: 0.4 }]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={styles.text}>Compartilhar</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  text: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
