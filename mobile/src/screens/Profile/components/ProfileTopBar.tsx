import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  username: string;
  isOwnProfile: boolean;
  onLeftPress?: () => void;
  onRightPress?: () => void;
}

export default function ProfileTopBar({
  username,
  isOwnProfile,
  onLeftPress,
  onRightPress,
}: Props) {
  return (
    <View style={styles.bar}>
      <Pressable style={styles.btn} onPress={onLeftPress} hitSlop={8}>
        {isOwnProfile ? (
          <Feather name="plus" size={28} color="#fff" />
        ) : (
          <Feather name="chevron-left" size={28} color="#fff" />
        )}
      </Pressable>

      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>{username}</Text>
        {isOwnProfile && (
          <MaterialCommunityIcons
            name="chevron-down"
            size={14}
            color="#fff"
            style={{ marginLeft: 2 }}
          />
        )}
      </View>

      <Pressable style={styles.btn} onPress={onRightPress} hitSlop={8}>
        {isOwnProfile ? (
          <Feather name="menu" size={24} color="#fff" />
        ) : (
          <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
