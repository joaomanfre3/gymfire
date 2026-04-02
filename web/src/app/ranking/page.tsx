'use client';

import Navbar from '@/components/Navbar';
import RankingPage from '@/components/ranking/RankingPage';

export default function Ranking() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />
      <main>
        <RankingPage />
      </main>
    </div>
  );
}
