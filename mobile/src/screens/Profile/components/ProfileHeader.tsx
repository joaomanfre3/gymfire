import React from 'react';
import { View, StyleSheet } from 'react-native';
import ProfileAvatar from './ProfileAvatar';
import ProfileInlineStats from './ProfileInlineStats';
import ProfileNameAndBio from './ProfileNameAndBio';
import ProfileActionButtons from './ProfileActionButtons';
import type { Profile } from '../api/profile';

interface Props {
  profile: Profile;
  isOwnProfile: boolean;
  onEditProfile?: () => void;
  onShareProfile?: () => void;
  onToggleFollow?: () => void;
  onMessage?: () => void;
  onFollowingMenu?: () => void;
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
}

export default function ProfileHeader({
  profile,
  isOwnProfile,
  onEditProfile,
  onShareProfile,
  onToggleFollow,
  onMessage,
  onFollowingMenu,
  onPressFollowers,
  onPressFollowing,
}: Props) {
  return (
    <View>
      <View style={styles.topRow}>
        <ProfileAvatar avatarUrl={profile.user.avatarUrl} name={profile.name} size={86} />
        <ProfileInlineStats
          postsCount={profile.stats.postsCount}
          followersCount={profile.stats.followersCount}
          followingCount={profile.stats.followingCount}
          onPressFollowers={onPressFollowers}
          onPressFollowing={onPressFollowing}
        />
      </View>

      <ProfileNameAndBio name={profile.name} bio={profile.bio} verified={profile.verified} />

      <ProfileActionButtons
        isOwnProfile={isOwnProfile}
        isFollowing={profile.viewerFollowing}
        onEditProfile={onEditProfile}
        onShareProfile={onShareProfile}
        onToggleFollow={onToggleFollow}
        onMessage={onMessage}
        onFollowingMenu={onFollowingMenu}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
});
