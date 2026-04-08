'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GoogleAuthSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const userInfo = searchParams.get('user_info');

    if (accessToken && refreshToken && userInfo) {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user_info', userInfo);
      router.replace('/');
    } else {
      router.replace('/login?error=oauth_failed');
    }
  }, [searchParams, router]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text)',
    }}>
      <p>Autenticando...</p>
    </div>
  );
}
