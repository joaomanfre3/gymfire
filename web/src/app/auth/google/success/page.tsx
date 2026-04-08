'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function GoogleAuthHandler() {
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

  return <p>Autenticando...</p>;
}

export default function GoogleAuthSuccess() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text)',
    }}>
      <Suspense fallback={<p>Carregando...</p>}>
        <GoogleAuthHandler />
      </Suspense>
    </div>
  );
}
