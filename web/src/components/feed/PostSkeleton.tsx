export default function PostSkeleton() {
  return (
    <div style={{
      background: '#141420',
      borderBottom: '1px solid rgba(148, 148, 172, 0.08)',
    }}>
      {/* Header skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px 10px' }}>
        <div className="shimmer" style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1A1A28', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="shimmer" style={{ height: '14px', width: '140px', borderRadius: '4px', background: '#1A1A28', marginBottom: '6px' }} />
          <div className="shimmer" style={{ height: '12px', width: '100px', borderRadius: '4px', background: '#1A1A28' }} />
        </div>
      </div>

      {/* Text skeleton */}
      <div style={{ padding: '0 16px 10px' }}>
        <div className="shimmer" style={{ height: '14px', width: '100%', borderRadius: '4px', background: '#1A1A28', marginBottom: '6px' }} />
        <div className="shimmer" style={{ height: '14px', width: '75%', borderRadius: '4px', background: '#1A1A28' }} />
      </div>

      {/* Image skeleton */}
      <div className="shimmer" style={{ width: '100%', height: '300px', background: '#1A1A28' }} />

      {/* Actions skeleton */}
      <div style={{ display: 'flex', gap: '16px', padding: '12px 16px' }}>
        <div className="shimmer" style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1A1A28' }} />
        <div className="shimmer" style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1A1A28' }} />
        <div className="shimmer" style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1A1A28' }} />
        <div className="shimmer" style={{ width: '60px', height: '14px', borderRadius: '4px', background: '#1A1A28', marginLeft: 'auto' }} />
      </div>
    </div>
  );
}
