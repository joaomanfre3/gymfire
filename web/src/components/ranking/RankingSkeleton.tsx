export default function RankingSkeleton() {
  return (
    <div>
      {/* Tabs skeleton */}
      <div className="shimmer" style={{ height: '44px', borderRadius: '12px', marginBottom: '12px', background: '#1A1A28' }} />

      {/* Filters skeleton */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {[80, 70, 65, 75, 60].map((w, i) => (
          <div key={i} className="shimmer" style={{ width: `${w}px`, height: '32px', borderRadius: '8px', background: '#1A1A28' }} />
        ))}
      </div>

      {/* Podium skeleton */}
      <div style={{
        background: '#141420',
        borderRadius: '20px',
        border: '1px solid rgba(148, 148, 172, 0.08)',
        padding: '28px 20px 24px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
      }}>
        {[64, 80, 60].map((s, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div className="shimmer" style={{ width: `${s}px`, height: `${s}px`, borderRadius: '50%', background: '#1A1A28' }} />
            <div className="shimmer" style={{ width: '80px', height: '14px', borderRadius: '4px', background: '#1A1A28' }} />
            <div className="shimmer" style={{ width: '50px', height: '20px', borderRadius: '4px', background: '#1A1A28' }} />
          </div>
        ))}
      </div>

      {/* List skeleton */}
      <div style={{
        background: '#141420',
        borderRadius: '16px',
        border: '1px solid rgba(148, 148, 172, 0.08)',
        overflow: 'hidden',
      }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(148, 148, 172, 0.08)',
          }}>
            <div className="shimmer" style={{ width: '32px', height: '16px', borderRadius: '4px', background: '#1A1A28' }} />
            <div className="shimmer" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1A1A28', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="shimmer" style={{ width: '120px', height: '14px', borderRadius: '4px', background: '#1A1A28', marginBottom: '4px' }} />
              <div className="shimmer" style={{ width: '80px', height: '12px', borderRadius: '4px', background: '#1A1A28' }} />
            </div>
            <div className="shimmer" style={{ width: '50px', height: '18px', borderRadius: '4px', background: '#1A1A28' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
