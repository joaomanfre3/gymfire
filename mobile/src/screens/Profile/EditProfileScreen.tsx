import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useAuthStore } from '../../stores/authStore';
import api from '../../api/client';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [coverUrl, setCoverUrl] = useState(user?.coverUrl || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.patch('/users/update-profile', {
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });

      // Update the store with new user data
      if (user) {
        setUser({
          ...user,
          displayName: displayName.trim(),
          bio: bio.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
          coverUrl: coverUrl.trim() || undefined,
          ...data,
        });
      }

      navigation.goBack();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update profile.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Preview */}
        <View style={styles.avatarSection}>
          <Avatar
            user={
              user
                ? { ...user, avatarUrl: avatarUrl || undefined }
                : undefined
            }
            size={80}
            showStreakRing
          />
          <Text style={styles.avatarHint}>
            Enter an image URL below to change your avatar
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your display name"
            autoCapitalize="words"
          />

          <View style={styles.fieldGap} />

          <Input
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={4}
          />

          <View style={styles.fieldGap} />

          <Input
            label="Avatar URL"
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="https://example.com/avatar.jpg"
            keyboardType="url"
            autoCapitalize="none"
          />

          <View style={styles.fieldGap} />

          <Input
            label="Cover Photo URL"
            value={coverUrl}
            onChangeText={setCoverUrl}
            placeholder="https://example.com/cover.jpg"
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            variant="primary"
            loading={saving}
            fullWidth
          />
          <View style={styles.buttonGap} />
          <Button
            title="Cancel"
            onPress={handleCancel}
            variant="outline"
            fullWidth
            disabled={saving}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatarHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },

  // Form
  form: {
    marginTop: spacing.md,
  },
  fieldGap: {
    height: spacing.lg,
  },

  // Buttons
  buttons: {
    marginTop: spacing.xxl,
  },
  buttonGap: {
    height: spacing.md,
  },
});
