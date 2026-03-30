import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { typography } from '../../theme/typography';
import { HomeStackParamList } from '../../navigation/types';
import api from '../../api/client';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'SpeedCreator'>;

export default function SpeedCreatorScreen() {
  const navigation = useNavigation<Nav>();

  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!mediaUrl.trim()) {
      Alert.alert('Required', 'Please enter a media URL.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/speeds', {
        mediaUrl: mediaUrl.trim(),
        mediaType: 'IMAGE',
        caption: caption.trim() || undefined,
      });
      Alert.alert('Posted!', 'Your speed has been posted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to post speed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Placeholder for camera -- full integration later */}
        <View style={styles.cameraPlaceholder}>
          <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
          <Text style={styles.placeholderText}>
            Camera integration coming soon
          </Text>
          <Text style={styles.placeholderSubtext}>
            For now, enter an image URL below
          </Text>
        </View>

        {/* Media URL Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Media URL</Text>
          <TextInput
            style={styles.input}
            value={mediaUrl}
            onChangeText={setMediaUrl}
            placeholder="https://example.com/image.jpg"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        {/* Caption Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Caption (optional)</Text>
          <TextInput
            style={[styles.input, styles.captionInput]}
            value={caption}
            onChangeText={setCaption}
            placeholder="What's happening at the gym?"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={200}
          />
          <Text style={styles.charCount}>{caption.length}/200</Text>
        </View>

        {/* Post Button */}
        <TouchableOpacity
          style={[styles.postBtn, (!mediaUrl.trim() || loading) && styles.postBtnDisabled]}
          activeOpacity={0.7}
          onPress={handlePost}
          disabled={!mediaUrl.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="flash" size={20} color="#FFF" />
              <Text style={styles.postBtnText}>Post Speed</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.infoText}>
          Speeds disappear after 24 hours. Add them to highlights to keep them on your profile.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  // Camera placeholder
  cameraPlaceholder: {
    height: 200,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  placeholderText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontWeight: fontWeight.semibold as '600',
  },
  placeholderSubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  // Inputs
  inputGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium as '500',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  captionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  // Post button
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  postBtnDisabled: {
    opacity: 0.5,
  },
  postBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold as '600',
    color: '#FFFFFF',
  },

  infoText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
