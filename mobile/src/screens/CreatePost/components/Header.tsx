import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onBack: () => void;
}

export default function Header({ onBack }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.btn}>
        <Ionicons name="chevron-back" size={26} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.title}>Novo post</Text>
      <View style={styles.btn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 8,
  },
  btn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
