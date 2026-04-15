import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
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
import { makeRedirectUri } from 'expo-auth-session';
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
      setError('Preencha todos os campos');
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
      // Generate redirect URI for current environment (exp:// in Expo Go, gymfire:// in dev build)
      const redirectUri = makeRedirectUri({ scheme: APP_SCHEME, path: 'auth/callback' });
      const authUrl = `${API_BASE}/api/auth/google?mobile_redirect=${encodeURIComponent(redirectUri)}`;

      // Open browser — listen for redirect back to our app
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');
        const userInfoStr = url.searchParams.get('user_info');

        if (accessToken && refreshToken) {
          const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
          await loginWithGoogleTokens(accessToken, refreshToken, userInfo);
        } else {
          setError('Falha no login com Google. Tokens ausentes.');
        }
      } else if (result.type !== 'cancel' && result.type !== 'dismiss') {
        setError('Login com Google foi interrompido.');
      }
    } catch (err: any) {
      console.log('[GoogleAuth] ERROR:', err?.message, err);
      setError(err?.message || 'Falha no login com Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Esqueceu a senha?',
      'A funcionalidade de recuperar senha estará disponível em breve.',
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
          <Image
            source={require('../../../assets/gymfire-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>Sua jornada fitness começa aqui</Text>
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
                label="Usuário ou Email"
                value={username}
                onChangeText={setUsername}
                placeholder="Digite seu usuário"
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
                label="Senha"
                value={password}
                onChangeText={setPassword}
                placeholder="Digite sua senha"
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotRow}>
            <Text style={styles.forgotText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            title="Entrar"
            onPress={handleLogin}
            loading={loading}
            fullWidth
          />

          {/* OR Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Login */}
          <Button
            title="Continuar com Google"
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
            {'Não tem uma conta? '}
            <Text style={styles.bottomAccent}>Cadastre-se</Text>
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
  logoImage: {
    width: 220,
    height: 60,
    marginBottom: spacing.sm,
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
