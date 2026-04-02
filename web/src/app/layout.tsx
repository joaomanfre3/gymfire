import type { Metadata } from 'next';
import './globals.css';
import BottomNavWrapper from '@/components/BottomNavWrapper';

export const metadata: Metadata = {
  title: 'GymFire',
  description: 'Sua plataforma fitness social',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen" style={{ background: '#0A0A0F', color: '#F0F0F8' }}>
        {children}
        <BottomNavWrapper />
      </body>
    </html>
  );
}
