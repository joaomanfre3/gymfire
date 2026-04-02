'use client';

import Navbar from '@/components/Navbar';
import WorkoutPage from '@/components/workout/WorkoutPage';

export default function Workout() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />
      <main>
        <WorkoutPage />
      </main>
    </div>
  );
}
