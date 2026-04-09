'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUser, apiFetch } from '@/lib/api';
import { DumbbellIcon, RunningIcon, BarChartIcon, CameraIcon } from './FeedIcons';

type PostType = 'WORKOUT' | 'MOTIVATION' | 'PROGRESS' | 'TIP';

interface RecentWorkout {
  id: string;
  title: string;
  startedAt: string;
  durationSecs: number;
  totalVolume: number;
  totalSets: number;
}

function CloseIcon() {
  return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#9494AC" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}min`;
}

export default function CreatePostBox() {
  const router = useRouter();
  const user = getUser();

  const [showModal, setShowModal] = useState(false);
  const [postType, setPostType] = useState<PostType>('WORKOUT');
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [workouts, setWorkouts] = useState<RecentWorkout[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    if (showModal && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showModal]);

  function openModal(type: PostType) {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    setPostType(type);
    setCaption('');
    setSelectedWorkoutId(null);
    setSelectedImages([]);
    setImagePreviews([]);
    setShowModal(true);

    if (type === 'WORKOUT') {
      loadWorkouts();
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newFiles = [...selectedImages, ...files].slice(0, 4); // max 4 images
    setSelectedImages(newFiles);
    setImagePreviews(newFiles.map(f => URL.createObjectURL(f)));
  }

  function removeImage(index: number) {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
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

  async function handleSubmit() {
    if (!caption.trim() && !selectedWorkoutId && selectedImages.length === 0) return;
    setSubmitting(true);
    try {
      // Upload images first (use fetch directly to avoid Content-Type override)
      const mediaUrls: string[] = [];
      if (selectedImages.length > 0) {
        setUploadingImages(true);
        const token = getToken();
        for (const file of selectedImages) {
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });
          if (uploadRes.ok) {
            const data = await uploadRes.json();
            mediaUrls.push(data.url || data.mediaUrl);
          }
        }
        setUploadingImages(false);
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
        setShowModal(false);
        setCaption('');
        setSelectedWorkoutId(null);
        setSelectedImages([]);
        setImagePreviews([]);
        window.location.reload();
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  const typeConfig: Record<PostType, { label: string; placeholder: string }> = {
    WORKOUT: { label: 'Treino', placeholder: 'Conte sobre seu treino de hoje...' },
    MOTIVATION: { label: 'Corrida', placeholder: 'Como foi sua corrida hoje?' },
    PROGRESS: { label: 'Progresso', placeholder: 'Compartilhe seu progresso...' },
    TIP: { label: 'Foto', placeholder: 'Adicione uma legenda...' },
  };

  const actions: { icon: React.ReactNode; label: string; type: PostType }[] = [
    { icon: <DumbbellIcon size={14} color="#9494AC" />, label: 'Treino', type: 'WORKOUT' },
    { icon: <RunningIcon size={14} color="#9494AC" />, label: 'Corrida', type: 'MOTIVATION' },
    { icon: <BarChartIcon size={14} color="#9494AC" />, label: 'Progresso', type: 'PROGRESS' },
    { icon: <CameraIcon size={14} color="#9494AC" />, label: 'Foto', type: 'TIP' },
  ];

  return (
    <>
      <div style={{
        background: '#141420',
        borderBottom: '1px solid rgba(148, 148, 172, 0.08)',
        padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: user ? 'linear-gradient(135deg, #FF6B35, #E05520)' : '#1A1A28',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0,
          }}>
            {user ? (user.displayName || user.username)[0].toUpperCase() : ''}
          </div>

          <div
            onClick={() => openModal('WORKOUT')}
            style={{
              flex: 1, background: '#1A1A28',
              border: '1px solid rgba(148, 148, 172, 0.08)',
              borderRadius: '24px', padding: '10px 16px',
              fontSize: '14px', color: '#5C5C72', cursor: 'pointer',
              transition: 'border-color 200ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(148, 148, 172, 0.12)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(148, 148, 172, 0.08)')}
          >
            O que você treinou hoje?
          </div>

          <button
            onClick={() => openModal('TIP')}
            style={{
              width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', background: 'transparent',
              border: 'none', cursor: 'pointer', color: '#FF6B35',
              transition: 'background 200ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 107, 53, 0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <CameraIcon size={20} color="#FF6B35" />
          </button>
        </div>

        <div className="hide-scrollbar-mobile" style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
          {actions.map(action => (
            <button
              key={action.label}
              onClick={() => openModal(action.type)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px',
                background: '#1A1A28', border: '1px solid rgba(148, 148, 172, 0.08)',
                fontSize: '12px', fontWeight: 600, color: '#9494AC',
                cursor: 'pointer', transition: 'all 200ms ease', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 107, 53, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 107, 53, 0.25)';
                e.currentTarget.style.color = '#FF6B35';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#1A1A28';
                e.currentTarget.style.borderColor = 'rgba(148, 148, 172, 0.08)';
                e.currentTarget.style.color = '#9494AC';
              }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Create Post Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{
            width: '100%', maxWidth: '480px',
            background: '#141420', borderRadius: '20px',
            border: '1px solid rgba(148, 148, 172, 0.1)',
            overflow: 'hidden',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(148, 148, 172, 0.08)',
            }}>
              <button onClick={() => setShowModal(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
              }}>
                <CloseIcon />
              </button>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F8' }}>
                Novo Post
              </span>
              <button
                onClick={handleSubmit}
                disabled={submitting || (!caption.trim() && !selectedWorkoutId && selectedImages.length === 0)}
                style={{
                  background: (!caption.trim() && !selectedWorkoutId && selectedImages.length === 0) ? '#5C5C72' : '#FF6B35',
                  color: '#0A0A0F', border: 'none', borderRadius: '8px',
                  padding: '8px 18px', fontSize: '13px', fontWeight: 700,
                  cursor: (!caption.trim() && !selectedWorkoutId && selectedImages.length === 0) ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                  transition: 'all 200ms',
                }}
              >
                {uploadingImages ? 'Enviando...' : submitting ? 'Postando...' : 'Postar'}
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              {/* Type selector */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {actions.map(action => {
                  const isActive = postType === action.type;
                  return (
                    <button
                      key={action.type}
                      onClick={() => {
                        setPostType(action.type);
                        setSelectedWorkoutId(null);
                        if (action.type === 'WORKOUT') loadWorkouts();
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '7px 14px', borderRadius: '20px',
                        fontSize: '12px', fontWeight: isActive ? 700 : 600,
                        cursor: 'pointer', transition: 'all 200ms',
                        border: '1px solid transparent',
                        background: isActive ? '#FF6B35' : '#1A1A28',
                        color: isActive ? '#0A0A0F' : '#9494AC',
                        borderColor: isActive ? '#FF6B35' : 'rgba(148,148,172,0.08)',
                      }}
                    >
                      {action.label}
                    </button>
                  );
                })}
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
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8' }}>
                    {user?.displayName || user?.username || 'Usuário'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#5C5C72' }}>Público</div>
                </div>
              </div>

              {/* Caption textarea */}
              <textarea
                ref={textareaRef}
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder={typeConfig[postType].placeholder}
                maxLength={500}
                rows={4}
                style={{
                  width: '100%', background: 'transparent', border: 'none',
                  outline: 'none', resize: 'none',
                  color: '#F0F0F8', fontSize: '15px', lineHeight: 1.6,
                  fontFamily: 'inherit',
                }}
              />
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#5C5C72', marginTop: '4px' }}>
                {caption.length}/500
              </div>

              {/* Image upload area */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />

              {/* Image previews */}
              {imagePreviews.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: imagePreviews.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                  gap: '4px', marginTop: '12px', borderRadius: '12px', overflow: 'hidden',
                }}>
                  {imagePreviews.map((src, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: imagePreviews.length === 1 ? '4/3' : '1' }}>
                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <button onClick={() => removeImage(i)} style={{
                        position: 'absolute', top: '6px', right: '6px',
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '14px',
                      }}>&times;</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add photo button */}
              {selectedImages.length < 4 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    width: '100%', padding: '12px 14px', marginTop: '12px',
                    borderRadius: '10px', background: '#1A1A28',
                    border: '1px dashed rgba(148,148,172,0.15)',
                    color: '#9494AC', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 200ms',
                  }}
                >
                  <CameraIcon size={16} color="#9494AC" />
                  {selectedImages.length === 0 ? 'Adicionar foto' : `Adicionar mais (${selectedImages.length}/4)`}
                </button>
              )}

              {/* Workout selector */}
              {postType === 'WORKOUT' && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{
                    fontSize: '12px', fontWeight: 700, color: '#5C5C72',
                    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px',
                  }}>
                    Vincular treino
                  </div>

                  {loadingWorkouts ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#5C5C72', fontSize: '12px' }}>
                      Carregando treinos...
                    </div>
                  ) : workouts.length === 0 ? (
                    <div style={{
                      padding: '16px', textAlign: 'center', color: '#5C5C72', fontSize: '12px',
                      background: '#1A1A28', borderRadius: '10px',
                      border: '1px solid rgba(148,148,172,0.06)',
                    }}>
                      Nenhum treino encontrado. Complete um treino primeiro!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {workouts.map(w => {
                        const isSelected = selectedWorkoutId === w.id;
                        return (
                          <button
                            key={w.id}
                            onClick={() => setSelectedWorkoutId(isSelected ? null : w.id)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '12px 14px', borderRadius: '10px',
                              background: isSelected ? 'rgba(255,107,53,0.08)' : '#1A1A28',
                              border: `1px solid ${isSelected ? 'rgba(255,107,53,0.3)' : 'rgba(148,148,172,0.06)'}`,
                              cursor: 'pointer', transition: 'all 200ms',
                              textAlign: 'left', width: '100%',
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8' }}>
                                {w.title || 'Treino'}
                              </div>
                              <div style={{ fontSize: '11px', color: '#5C5C72', marginTop: '2px' }}>
                                {new Date(w.startedAt).toLocaleDateString('pt-BR')} · {formatDuration(w.durationSecs || 0)} · {w.totalSets} séries
                              </div>
                            </div>
                            <div style={{
                              width: '20px', height: '20px', borderRadius: '50%',
                              border: `2px solid ${isSelected ? '#FF6B35' : '#5C5C72'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                              background: isSelected ? '#FF6B35' : 'transparent',
                              transition: 'all 200ms',
                            }}>
                              {isSelected && (
                                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#0A0A0F" strokeWidth={3}>
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
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
        </div>
      )}
    </>
  );
}
