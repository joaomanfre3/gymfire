'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUser, apiFetch } from '@/lib/api';

// Icons
function CloseIcon() {
  return <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#F0F0F8" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}

function FeedIcon() {
  return (
    <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth={1.5}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="9" x2="9" y2="21" />
    </svg>
  );
}

function CutsIcon() {
  return (
    <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
      <circle cx="12" cy="12" r="2" fill="#FF6B35" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#F0F0F8" strokeWidth={1.5}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

type PostType = 'WORKOUT' | 'MOTIVATION' | 'PROGRESS' | 'TIP';

interface RecentWorkout {
  id: string;
  title: string;
  startedAt: string;
  durationSecs: number;
  totalSets: number;
}

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}min`;
}

export default function CreatePage() {
  const router = useRouter();
  const user = getUser();

  // Feed post creation state
  const [showFeedCreator, setShowFeedCreator] = useState(false);
  const [postType, setPostType] = useState<PostType>('WORKOUT');
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [workouts, setWorkouts] = useState<RecentWorkout[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const feedMediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
  }, [router]);

  useEffect(() => {
    if (showFeedCreator && textareaRef.current) textareaRef.current.focus();
  }, [showFeedCreator]);

  function openFeedCreator() {
    setShowFeedCreator(true);
    setPostType('WORKOUT');
    setCaption('');
    setSelectedWorkoutId(null);
    setSelectedMedia(null);
    setMediaPreview(null);
    loadWorkouts();
  }

  async function loadWorkouts() {
    setLoadingWorkouts(true);
    try {
      const res = await apiFetch('/api/workouts');
      if (res.ok) {
        const data = await res.json();
        setWorkouts((data || []).slice(0, 10));
      }
    } catch { /* ignore */ }
    setLoadingWorkouts(false);
  }

  function handleGallerySelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Decide: image/video -> go to feed post with media, or drop creator
    // For now open feed creator with media attached
    setSelectedMedia(file);
    setMediaPreview(URL.createObjectURL(file));
    setShowFeedCreator(true);
    setPostType(file.type.startsWith('video/') ? 'TIP' : 'TIP');
    e.target.value = '';
  }

  function handleFeedMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedMedia(file);
    setMediaPreview(URL.createObjectURL(file));
    e.target.value = '';
  }

  async function handleSubmitPost() {
    if (!caption.trim() && !selectedWorkoutId && !selectedMedia) return;
    setSubmitting(true);
    try {
      let mediaUrls: string[] = [];

      // Upload media if present
      if (selectedMedia) {
        const formData = new FormData();
        formData.append('file', selectedMedia);
        const token = localStorage.getItem('access_token');
        const uploadRes = await fetch('/api/messages/upload', {
          method: 'POST', body: formData,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (uploadRes.ok) {
          const { mediaUrl } = await uploadRes.json();
          mediaUrls = [mediaUrl];
        }
      }

      const res = await apiFetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: caption.trim(),
          type: postType,
          visibility: 'PUBLIC',
          workoutId: selectedWorkoutId || undefined,
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        }),
      });
      if (res.ok) {
        router.push('/');
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  const typeOptions: { type: PostType; label: string }[] = [
    { type: 'WORKOUT', label: 'Treino' },
    { type: 'MOTIVATION', label: 'Corrida' },
    { type: 'PROGRESS', label: 'Progresso' },
    { type: 'TIP', label: 'Foto' },
  ];

  const typeConfig: Record<PostType, string> = {
    WORKOUT: 'Conte sobre seu treino de hoje...',
    MOTIVATION: 'Como foi sua corrida hoje?',
    PROGRESS: 'Compartilhe seu progresso...',
    TIP: 'Adicione uma legenda...',
  };

  // ==================== FEED CREATOR FULLSCREEN ====================
  if (showFeedCreator) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: '1px solid rgba(148,148,172,0.08)',
          background: 'rgba(10,10,15,0.95)', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <button onClick={() => setShowFeedCreator(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <CloseIcon />
          </button>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F8' }}>Novo Post</span>
          <button
            onClick={handleSubmitPost}
            disabled={submitting || (!caption.trim() && !selectedWorkoutId && !selectedMedia)}
            style={{
              background: (!caption.trim() && !selectedWorkoutId && !selectedMedia) ? '#5C5C72' : '#FF6B35',
              color: '#0A0A0F', border: 'none', borderRadius: '8px',
              padding: '8px 18px', fontSize: '13px', fontWeight: 700,
              cursor: (!caption.trim() && !selectedWorkoutId && !selectedMedia) ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? 'Postando...' : 'Postar'}
          </button>
        </div>

        <div style={{ flex: 1, padding: '16px', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
          {/* Type selector */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {typeOptions.map(opt => (
              <button key={opt.type} onClick={() => { setPostType(opt.type); if (opt.type === 'WORKOUT') loadWorkouts(); }} style={{
                padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: postType === opt.type ? 700 : 600,
                cursor: 'pointer', border: '1px solid transparent',
                background: postType === opt.type ? '#FF6B35' : '#1A1A28',
                color: postType === opt.type ? '#0A0A0F' : '#9494AC',
                borderColor: postType === opt.type ? '#FF6B35' : 'rgba(148,148,172,0.08)',
                transition: 'all 200ms',
              }}>{opt.label}</button>
            ))}
          </div>

          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF6B35, #E05520)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '16px', flexShrink: 0,
            }}>
              {user ? (user.displayName || user.username)[0].toUpperCase() : '?'}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8' }}>{user?.displayName || user?.username || 'Usuário'}</div>
              <div style={{ fontSize: '11px', color: '#5C5C72' }}>Público</div>
            </div>
          </div>

          {/* Media preview */}
          {mediaPreview && (
            <div style={{ position: 'relative', marginBottom: '12px', borderRadius: '12px', overflow: 'hidden' }}>
              {selectedMedia?.type.startsWith('video/') ? (
                <video src={mediaPreview} controls playsInline style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '12px' }} />
              ) : (
                <img src={mediaPreview} alt="" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '12px' }} />
              )}
              <button onClick={() => { setSelectedMedia(null); setMediaPreview(null); }} style={{
                position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          )}

          {/* Caption */}
          <textarea
            ref={textareaRef}
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder={typeConfig[postType]}
            maxLength={500}
            rows={4}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none',
              color: '#F0F0F8', fontSize: '15px', lineHeight: 1.6, fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <button onClick={() => feedMediaInputRef.current?.click()} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#9494AC',
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600,
            }}>
              <ImageIcon /> Adicionar mídia
            </button>
            <span style={{ fontSize: '11px', color: '#5C5C72' }}>{caption.length}/500</span>
          </div>
          <input ref={feedMediaInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFeedMedia} />

          {/* Workout selector */}
          {postType === 'WORKOUT' && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Vincular treino
              </div>
              {loadingWorkouts ? (
                <div style={{ padding: '12px', textAlign: 'center', color: '#5C5C72', fontSize: '12px' }}>Carregando treinos...</div>
              ) : workouts.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#5C5C72', fontSize: '12px', background: '#1A1A28', borderRadius: '10px' }}>
                  Nenhum treino encontrado.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {workouts.map(w => {
                    const isSelected = selectedWorkoutId === w.id;
                    return (
                      <button key={w.id} onClick={() => setSelectedWorkoutId(isSelected ? null : w.id)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px', borderRadius: '10px',
                        background: isSelected ? 'rgba(255,107,53,0.08)' : '#1A1A28',
                        border: `1px solid ${isSelected ? 'rgba(255,107,53,0.3)' : 'rgba(148,148,172,0.06)'}`,
                        cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 200ms',
                      }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8' }}>{w.title || 'Treino'}</div>
                          <div style={{ fontSize: '11px', color: '#5C5C72', marginTop: '2px' }}>
                            {new Date(w.startedAt).toLocaleDateString('pt-BR')} · {formatDuration(w.durationSecs || 0)} · {w.totalSets} séries
                          </div>
                        </div>
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '50%',
                          border: `2px solid ${isSelected ? '#FF6B35' : '#5C5C72'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          background: isSelected ? '#FF6B35' : 'transparent',
                        }}>
                          {isSelected && <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#0A0A0F" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== MAIN CREATE PAGE ====================
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid rgba(148,148,172,0.08)',
      }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#F0F0F8" strokeWidth={2} strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <span style={{ fontSize: '18px', fontWeight: 800, color: '#F0F0F8' }}>Criar</span>
        <div style={{ width: '32px' }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '24px 20px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        {/* Two cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Feed Post Card */}
          <button
            onClick={openFeedCreator}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '20px', borderRadius: '16px',
              background: '#141420', border: '1px solid rgba(148,148,172,0.08)',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'all 200ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,107,53,0.3)'; e.currentTarget.style.background = 'rgba(255,107,53,0.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(148,148,172,0.08)'; e.currentTarget.style.background = '#141420'; }}
          >
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: 'rgba(255,107,53,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <FeedIcon />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F8', marginBottom: '4px' }}>Feed</div>
              <div style={{ fontSize: '13px', color: '#9494AC', lineHeight: 1.4 }}>
                Compartilhe treinos, corridas, progresso e fotos com seus seguidores
              </div>
            </div>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={2} style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
          </button>

          {/* Cuts/Drop Card */}
          <button
            onClick={() => router.push('/cuts/create')}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '20px', borderRadius: '16px',
              background: '#141420', border: '1px solid rgba(148,148,172,0.08)',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'all 200ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,107,53,0.3)'; e.currentTarget.style.background = 'rgba(255,107,53,0.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(148,148,172,0.08)'; e.currentTarget.style.background = '#141420'; }}
          >
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: 'rgba(255,107,53,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <CutsIcon />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F8', marginBottom: '4px' }}>Cuts</div>
              <div style={{ fontSize: '13px', color: '#9494AC', lineHeight: 1.4 }}>
                Grave momentos rápidos que desaparecem em 24 horas
              </div>
            </div>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={2} style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        {/* Gallery button */}
        <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => galleryInputRef.current?.click()}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              background: 'none', border: 'none', cursor: 'pointer', padding: '8px',
            }}
          >
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#1A1A28', border: '1px solid rgba(148,148,172,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              transition: 'border-color 200ms',
            }}>
              <ImageIcon />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#9494AC' }}>Arquivos</span>
          </button>
        </div>
        <input ref={galleryInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleGallerySelect} />
      </div>
    </div>
  );
}
