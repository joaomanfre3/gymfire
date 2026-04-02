'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getToken, getUser, apiFetch } from '@/lib/api';

// Icons
function CameraIcon() {
  return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#F0F0F8" strokeWidth={1.5}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
}
function CheckCircle() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2}><circle cx="12" cy="12" r="10" /><polyline points="9 12 11.5 14.5 16 9" /></svg>;
}
function XCircle() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FF4D6A" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>;
}
function LoadingSpinner() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#9494AC" strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
function ArrowLeft() {
  return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#F0F0F8" strokeWidth={2} strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
}

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Username check
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameError, setUsernameError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    const user = getUser();
    if (user) {
      setDisplayName(user.displayName || '');
      setUsername(user.username || '');
      setOriginalUsername(user.username || '');
      // Load full profile for bio
      apiFetch(`/api/users/${user.username}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setBio(data.bio || '');
            setAvatarUrl(data.avatarUrl || '');
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [router]);

  // Check username availability with debounce
  const checkUsername = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Same as original - no need to check
    if (value.toLowerCase() === originalUsername.toLowerCase()) {
      setUsernameStatus('idle');
      setUsernameError('');
      return;
    }

    // Validate format
    if (value.length < 3) {
      setUsernameStatus('invalid');
      setUsernameError('Mínimo 3 caracteres');
      return;
    }
    if (!/^[a-zA-Z0-9._]+$/.test(value)) {
      setUsernameStatus('invalid');
      setUsernameError('Apenas letras, números, . e _');
      return;
    }

    setUsernameStatus('checking');
    setUsernameError('');

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(value)}`);
        const data = await res.json();
        if (data.available) {
          setUsernameStatus('available');
          setUsernameError('');
        } else {
          setUsernameStatus('taken');
          setUsernameError(data.error || 'Username já está em uso');
        }
      } catch {
        setUsernameStatus('invalid');
        setUsernameError('Erro ao verificar');
      }
    }, 500);
  }, [originalUsername]);

  const handleUsernameChange = (value: string) => {
    // Only allow valid chars
    const cleaned = value.toLowerCase().replace(/[^a-z0-9._]/g, '');
    setUsername(cleaned);
    checkUsername(cleaned);
  };

  const canSave = displayName.length >= 2 && username.length >= 3 && usernameStatus !== 'taken' && usernameStatus !== 'checking' && usernameStatus !== 'invalid';

  const [saveError, setSaveError] = useState('');

  const handleSave = async () => {
    if (!canSave || saving) return;

    setSaving(true);
    setSaved(false);
    setSaveError('');

    try {
      const body: Record<string, string | undefined> = {
        displayName,
        username,
        bio,
      };
      if (avatarUrl) body.avatarUrl = avatarUrl;

      const res = await apiFetch('/api/users/update-profile', {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const updated = await res.json();
        // Update localStorage
        const currentUser = getUser();
        if (currentUser) {
          localStorage.setItem('user_info', JSON.stringify({
            ...currentUser,
            displayName: updated.displayName,
            username: updated.username,
          }));
        }
        setOriginalUsername(updated.username);
        setUsernameStatus('idle');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        let errorMsg = 'Erro ao salvar';
        try {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } catch { /* ignore parse error */ }
        setSaveError(errorMsg);
      }
    } catch {
      setSaveError('Erro de conexão. Verifique sua internet.');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
        <Navbar />
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
          <div className="shimmer" style={{ width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 20px', background: '#141420' }} />
          <div className="shimmer" style={{ height: '48px', borderRadius: '12px', marginBottom: '12px', background: '#141420' }} />
          <div className="shimmer" style={{ height: '48px', borderRadius: '12px', marginBottom: '12px', background: '#141420' }} />
          <div className="shimmer" style={{ height: '100px', borderRadius: '12px', background: '#141420' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '20px 16px 80px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => router.back()} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
          }}>
            <ArrowLeft />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F0F0F8', margin: 0, flex: 1 }}>Editar perfil</h1>
          {saved && <span style={{ fontSize: '13px', color: '#10B981', fontWeight: 600 }}>Salvo!</span>}
        </div>

        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%',
              background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #FF6B35, #E05520)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '36px', overflow: 'hidden',
              border: '3px solid rgba(255, 107, 53, 0.3)',
            }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                displayName ? displayName[0].toUpperCase() : '?'
              )}
            </div>
            {/* Camera overlay */}
            <button style={{
              position: 'absolute', bottom: '0', right: '0',
              width: '32px', height: '32px', borderRadius: '50%',
              background: '#FF6B35', border: '3px solid #0A0A0F',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <CameraIcon />
            </button>
          </div>
          <button style={{
            display: 'block', margin: '10px auto 0', background: 'none', border: 'none',
            color: '#FF6B35', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>
            Alterar foto de perfil
          </button>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Display Name */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Nome
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Seu nome de exibição"
              maxLength={50}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '12px',
                background: '#141420', border: '1px solid rgba(148, 148, 172, 0.12)',
                color: '#F0F0F8', fontSize: '15px', outline: 'none',
                transition: 'border-color 200ms',
                boxSizing: 'border-box',
              }}
            />
            {displayName.length > 0 && displayName.length < 2 && (
              <span style={{ fontSize: '11px', color: '#FF4D6A', marginTop: '4px', display: 'block' }}>Mínimo 2 caracteres</span>
            )}
          </div>

          {/* Username */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Nome de usuário
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '15px', color: '#5C5C72', fontWeight: 600, pointerEvents: 'none',
              }}>@</span>
              <input
                type="text"
                value={username}
                onChange={e => handleUsernameChange(e.target.value)}
                placeholder="seu_username"
                maxLength={30}
                style={{
                  width: '100%', padding: '14px 44px 14px 32px', borderRadius: '12px',
                  background: '#141420',
                  border: `1px solid ${
                    usernameStatus === 'available' ? 'rgba(16, 185, 129, 0.4)' :
                    usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'rgba(255, 77, 106, 0.4)' :
                    'rgba(148, 148, 172, 0.12)'
                  }`,
                  color: '#F0F0F8', fontSize: '15px', outline: 'none',
                  transition: 'border-color 200ms',
                  boxSizing: 'border-box',
                }}
              />
              {/* Status indicator */}
              <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                {usernameStatus === 'checking' && <LoadingSpinner />}
                {usernameStatus === 'available' && <CheckCircle />}
                {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <XCircle />}
              </div>
            </div>
            {/* Status message */}
            {usernameStatus === 'available' && (
              <span style={{ fontSize: '11px', color: '#10B981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle /> Disponível
              </span>
            )}
            {usernameStatus === 'taken' && (
              <span style={{ fontSize: '11px', color: '#FF4D6A', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <XCircle /> {usernameError}
              </span>
            )}
            {usernameStatus === 'invalid' && usernameError && (
              <span style={{ fontSize: '11px', color: '#FF4D6A', marginTop: '4px', display: 'block' }}>{usernameError}</span>
            )}
            {usernameStatus === 'checking' && (
              <span style={{ fontSize: '11px', color: '#9494AC', marginTop: '4px', display: 'block' }}>Verificando disponibilidade...</span>
            )}
          </div>

          {/* Bio */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Bio
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Conte sobre você..."
              maxLength={150}
              rows={3}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '12px',
                background: '#141420', border: '1px solid rgba(148, 148, 172, 0.12)',
                color: '#F0F0F8', fontSize: '15px', outline: 'none', resize: 'none',
                transition: 'border-color 200ms', lineHeight: 1.5,
                fontFamily: "'Inter', sans-serif",
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: '11px', color: '#5C5C72', textAlign: 'right', marginTop: '4px' }}>
              {bio.length}/150
            </div>
          </div>

          {/* Avatar URL (temp solution until file upload) */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              URL da foto de perfil
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              placeholder="https://exemplo.com/sua-foto.jpg"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '12px',
                background: '#141420', border: '1px solid rgba(148, 148, 172, 0.12)',
                color: '#F0F0F8', fontSize: '15px', outline: 'none',
                transition: 'border-color 200ms',
                boxSizing: 'border-box',
              }}
            />
            <span style={{ fontSize: '11px', color: '#5C5C72', marginTop: '4px', display: 'block' }}>
              Cole a URL de uma imagem. Upload de arquivo em breve.
            </span>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{
            width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
            background: canSave ? '#FF6B35' : '#1A1A28',
            color: canSave ? '#0A0A0F' : '#5C5C72',
            fontSize: '15px', fontWeight: 700, cursor: canSave ? 'pointer' : 'not-allowed',
            marginTop: '24px', transition: 'all 200ms',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>

        {saveError && (
          <div style={{
            marginTop: '12px', padding: '12px 16px', borderRadius: '10px',
            background: 'rgba(255, 77, 106, 0.08)', border: '1px solid rgba(255, 77, 106, 0.2)',
            color: '#FF4D6A', fontSize: '13px', fontWeight: 600, textAlign: 'center',
          }}>
            {saveError}
          </div>
        )}
      </main>
    </div>
  );
}
