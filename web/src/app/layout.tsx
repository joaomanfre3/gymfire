import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GymFire',
  description: 'Your fitness social platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--text)' }}>
        {children}
      </body>
    </html>
  );
}
