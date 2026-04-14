import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fontSize, fontWeight } from '../../theme/typography';
import { useAuthStore } from '../../stores/authStore';
import { AuthStackParamList } from '../../navigation/types';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

WebBrowser.maybeCompleteAuthSession();

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const API_BASE = 'https://gymfire.vercel.app';
const APP_SCHEME = 'gymfire';

export default function LoginScreen() {
  const navigation = useNavigation<LoginNavProp>();
  const login = useAuthStore((s) => s.login);
  const loginWithGoogleTokens = useAuthStore((s) => s.loginWithGoogleTokens);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await login(username.trim(), password);
    if (result) {
      setError(result);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      // Our API handles the Google OAuth and redirects back to the app with tokens
      const mobileRedirect = `${APP_SCHEME}://auth/callback`;
      const authUrl = `${API_BASE}/api/auth/google?mobile_redirect=${encodeURIComponent(mobileRedirect)}`;

      // Open browser — it will listen for any redirect to gymfire://
      const result = await WebBrowser.openAuthSessionAsync(authUrl, `${APP_SCHEME}://`);

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');
        const userInfoStr = url.searchParams.get('user_info');

        if (accessToken && refreshToken) {
          const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
          await loginWithGoogleTokens(accessToken, refreshToken, userInfo);
        } else {
          setError('Google sign-in failed. Missing tokens.');
        }
      } else if (result.type !== 'cancel' && result.type !== 'dismiss') {
        setError('Google sign-in was interrupted.');
      }
    } catch (err: any) {
      console.log('[GoogleAuth] ERROR:', err?.message, err);
      setError(err?.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Password reset functionality coming soon. Please contact support.',
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>{'\uD83D\uDD25 GymFire'}</Text>
          <Text style={styles.subtitle}>Your fitness journey starts here</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Ionicons
              name="person-outline"
              size={20}
              color={colors.textMuted}
              style={styles.inputIcon}
            />
            <View style={styles.inputFlex}>
              <Input
                label="Username or Email"
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.textMuted}
              style={styles.inputIcon}
            />
            <View style={styles.inputFlex}>
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            fullWidth
          />

          {/* OR Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Login */}
          <Button
            title="Continue with Google"
            onPress={handleGoogleLogin}
            loading={googleLoading}
            variant="outline"
            fullWidth
          />
        </View>

        {/* Bottom Link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={styles.bottomLink}
        >
          <Text style={styles.bottomText}>
            {"Don't have an account? "}
            <Text style={styles.bottomAccent}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logo: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold as '700',
    color: colors.primary,
    letterSpacing: 2,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginTop: 34,
    marginRight: spacing.sm,
  },
  inputFlex: {
    flex: 1,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
  },
  forgotText: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surfaceBorder,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
  },
  bottomLink: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  bottomText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  bottomAccent: {
    color: colors.primary,
    fontWeight: fontWeight.semibold as '600',
  },
});
