'use client';

import { useState, useEffect } from 'react';

const CONSENT_KEY = 'gymfire_lgpd_consent';

export default function LGPDBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    setShow(false);
  };

  const reject = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: false, date: new Date().toISOString() }));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: 'rgba(14, 14, 22, 0.98)', backdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(148, 148, 172, 0.12)',
      padding: '16px 20px',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <p style={{ fontSize: '13px', color: '#F0F0F8', margin: '0 0 4px', fontWeight: 600 }}>
            Privacidade e Cookies
          </p>
          <p style={{ fontSize: '12px', color: '#9494AC', margin: 0, lineHeight: 1.5 }}>
            Utilizamos cookies para melhorar sua experiência. Ao continuar, você concorda com nossa{' '}
            <a href="/privacy" style={{ color: '#FF6B35', textDecoration: 'underline' }}>Política de Privacidade</a>{' '}
            e <a href="/terms" style={{ color: '#FF6B35', textDecoration: 'underline' }}>Termos de Uso</a>, em conformidade com a LGPD (Lei 13.709/2018).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button onClick={reject} style={{
            padding: '10px 20px', borderRadius: '8px',
            border: '1px solid rgba(148, 148, 172, 0.12)', background: 'transparent',
            color: '#9494AC', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>Rejeitar</button>
          <button onClick={accept} style={{
            padding: '10px 20px', borderRadius: '8px',
            border: 'none', background: '#FF6B35',
            color: '#0A0A0F', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          }}>Aceitar</button>
        </div>
      </div>
    </div>
  );
}
