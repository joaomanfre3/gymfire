'use client';

import { useState, useEffect } from 'react';

const IMPERSONATE_KEY = 'gymfire_impersonating';
const ADMIN_BACKUP_KEY = 'gymfire_admin_backup';

export function startImpersonation(adminTokens: { accessToken: string; refreshToken: string; user: Record<string, unknown> }, targetTokens: { accessToken: string; refreshToken: string; user: Record<string, unknown> }) {
  // Save admin credentials
  localStorage.setItem(ADMIN_BACKUP_KEY, JSON.stringify({
    access_token: adminTokens.accessToken,
    refresh_token: adminTokens.refreshToken,
    user_info: adminTokens.user,
  }));

  // Switch to target user
  localStorage.setItem('access_token', targetTokens.accessToken);
  localStorage.setItem('refresh_token', targetTokens.refreshToken);
  localStorage.setItem('user_info', JSON.stringify(targetTokens.user));
  localStorage.setItem(IMPERSONATE_KEY, JSON.stringify({
    targetUsername: (targetTokens.user as Record<string, string>).username,
    targetDisplayName: (targetTokens.user as Record<string, string>).displayName,
  }));

  window.location.href = '/';
}

export function stopImpersonation() {
  const backup = localStorage.getItem(ADMIN_BACKUP_KEY);
  if (!backup) return;

  const adminData = JSON.parse(backup);
  localStorage.setItem('access_token', adminData.access_token);
  localStorage.setItem('refresh_token', adminData.refresh_token);
  localStorage.setItem('user_info', JSON.stringify(adminData.user_info));
  localStorage.removeItem(IMPERSONATE_KEY);
  localStorage.removeItem(ADMIN_BACKUP_KEY);

  window.location.href = '/profile';
}

export default function ImpersonationBanner() {
  const [impersonating, setImpersonating] = useState<{ targetUsername: string; targetDisplayName: string } | null>(null);

  useEffect(() => {
    const data = localStorage.getItem(IMPERSONATE_KEY);
    if (data) {
      try { setImpersonating(JSON.parse(data)); } catch { /* ignore */ }
    }
  }, []);

  if (!impersonating) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'rgba(220, 38, 38, 0.95)', backdropFilter: 'blur(8px)',
      padding: '8px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
    }}>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
      </svg>
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
        Você está logado como <strong>@{impersonating.targetUsername}</strong> ({impersonating.targetDisplayName})
      </span>
      <button
        onClick={stopImpersonation}
        style={{
          padding: '5px 14px', borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.3)',
          background: 'rgba(0,0,0,0.3)',
          color: '#fff', fontSize: '12px', fontWeight: 700,
          cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px',
        }}
      >
        Voltar
      </button>
    </div>
  );
}
