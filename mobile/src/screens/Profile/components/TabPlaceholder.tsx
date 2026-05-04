import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

interface Props {
  variant: 'reels' | 'saved';
}

const COPY = {
  reels: {
    title: 'Reels em breve',
    subtitle: 'Essa funcionalidade estará disponível em breve.',
    renderIcon: () => <MaterialCommunityIcons name="play-box-outline" size={48} color="#666" />,
  },
  saved: {
    title: 'Salvos em breve',
    subtitle: 'Quando você salvar posts, eles aparecerão aqui.',
    renderIcon: () => <Feather name="bookmark" size={48} color="#666" />,
  },
};

export default function TabPlaceholder({ variant }: Props) {
  const copy = COPY[variant];
  return (
    <View style={styles.wrap}>
      {copy.renderIcon()}
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  title: { fontSize: 16, fontWeight: '600', color: '#fff', marginTop: 16 },
  subtitle: { fontSize: 13, fontWeight: '400', color: '#a8a8a8', marginTop: 4, textAlign: 'center' },
});
