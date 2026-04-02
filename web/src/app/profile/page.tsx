'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProfilePage from '@/components/profile/ProfilePage';
import { getToken } from '@/lib/api';

export default function MyProfile() {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />
      <main>
        <ProfilePage />
      </main>
    </div>
  );
}
