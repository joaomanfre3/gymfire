'use client';

import Navbar from '@/components/Navbar';
import FeedPage from '@/components/feed/FeedPage';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />
      <main>
        <FeedPage />
      </main>
    </div>
  );
}
