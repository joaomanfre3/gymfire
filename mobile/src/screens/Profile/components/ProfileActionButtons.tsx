import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  isOwnProfile: boolean;
  isFollowing?: boolean;
  onEditProfile?: () => void;
  onShareProfile?: () => void;
  onToggleFollow?: () => void;
  onMessage?: () => void;
  onFollowingMenu?: () => void;
}

export default function ProfileActionButtons({
  isOwnProfile,
  isFollowing,
  onEditProfile,
  onShareProfile,
  onToggleFollow,
  onMessage,
  onFollowingMenu,
}: Props) {
  if (isOwnProfile) {
    return (
      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={onEditProfile}>
          <Text style={styles.btnText}>Editar perfil</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={onShareProfile}>
          <Text style={styles.btnText}>Compartilhar perfil</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {isFollowing ? (
        <Pressable style={styles.btn} onPress={onFollowingMenu ?? onToggleFollow}>
          <View style={styles.followingInner}>
            <Text style={styles.btnText}>Seguindo</Text>
            <MaterialCommunityIcons name="chevron-down" size={14} color="#fff" style={{ marginLeft: 4 }} />
          </View>
        </Pressable>
      ) : (
        <Pressable style={[styles.btn, styles.followBtn]} onPress={onToggleFollow}>
          <Text style={styles.btnText}>Seguir</Text>
        </Pressable>
      )}
      <Pressable style={styles.btn} onPress={onMessage}>
        <Text style={styles.btnText}>Mensagem</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 14,
    gap: 6,
  },
  btn: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtn: { backgroundColor: '#3B82F6' },
  btnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  followingInner: { flexDirection: 'row', alignItems: 'center' },
});
