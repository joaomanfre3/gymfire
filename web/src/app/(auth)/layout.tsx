export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--background)' }}>
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold mb-2" style={{ color: 'var(--primary)' }}>
          🔥 GymFire
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Your fitness social platform
        </p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
