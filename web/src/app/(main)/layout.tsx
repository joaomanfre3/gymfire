'use client';

import AuthCheck from '@/components/AuthCheck';
import Navbar from '@/components/Navbar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthCheck>
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <main className="md:ml-60 pb-20 md:pb-6 px-4 md:px-8 pt-6 max-w-4xl">
          {children}
        </main>
      </div>
    </AuthCheck>
  );
}
