import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

export type ProfileTab = 'posts' | 'reels' | 'saved';

interface Props {
  active: ProfileTab;
  onChange: (tab: ProfileTab) => void;
  isOwnProfile: boolean;
}

export default function ProfileTabs({ active, onChange, isOwnProfile }: Props) {
  const tabs: { key: ProfileTab; render: (color: string) => React.ReactNode }[] = [
    { key: 'posts', render: (c) => <MaterialCommunityIcons name="view-grid" size={24} color={c} /> },
    { key: 'reels', render: (c) => <MaterialCommunityIcons name="play-box-outline" size={24} color={c} /> },
  ];
  if (isOwnProfile) {
    tabs.push({ key: 'saved', render: (c) => <Feather name="bookmark" size={24} color={c} /> });
  }

  return (
    <View style={styles.bar}>
      {tabs.map((t) => {
        const isActive = active === t.key;
        const color = isActive ? '#fff' : '#888';
        return (
          <Pressable
            key={t.key}
            style={styles.tab}
            onPress={() => onChange(t.key)}
            hitSlop={4}
          >
            {t.render(color)}
            {isActive && <View style={styles.indicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    marginTop: 18,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: '#fff',
  },
});
