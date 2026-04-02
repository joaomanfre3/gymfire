'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getToken } from '@/lib/api';

type Mode = 'camera' | 'preview';

export default function CreateCutPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('camera');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  async function startCamera() {
    setCameraError(null);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 }, aspectRatio: { ideal: 9 / 16 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError('Nao foi possivel acessar a camera. Verifique as permissoes do navegador.');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function toggleRecording() {
    if (recording) stopRecording();
    else startRecording();
  }

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    try {
      const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setMediaBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setMode('preview');
        stopCamera();
      };
      recorder.start(100);
      recorderRef.current = recorder;
      setRecording(true);
      setRecordTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordTime(prev => {
          if (prev >= 60) { stopRecording(); return prev; }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setCameraError('Gravacao de video nao suportada neste navegador.');
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    setRecording(false);
  }

  const retake = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setMediaBlob(null);
    setPreviewUrl(null);
    setMode('camera');
    startCamera();
  }, [previewUrl]);

  async function publish() {
    if (!mediaBlob || uploading) return;
    setUploading(true);
    try {
      // Upload
      const formData = new FormData();
      formData.append('file', mediaBlob, 'cut.webm');
      const token = localStorage.getItem('access_token');
      const uploadRes = await fetch('/api/drops/upload', {
        method: 'POST', body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { mediaUrl } = await uploadRes.json();

      // Create cut
      const res = await apiFetch('/api/cuts', {
        method: 'POST',
        body: JSON.stringify({ videoUrl: mediaUrl, caption: caption.trim() || null }),
      });
      if (res.ok) {
        router.push('/cuts');
      }
    } catch (err) {
      console.error('Publish error:', err);
    }
    setUploading(false);
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
      }}>
        <button onClick={() => { stopCamera(); router.back(); }} style={{
          background: 'none', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer', lineHeight: 1,
        }}>&times;</button>
        <span style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>
          {mode === 'camera' ? 'Gravar Cut' : 'Pre-visualizacao'}
        </span>
        {mode === 'camera' ? (
          <button onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
            width: '36px', height: '36px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}><path d="M16.5 8.5A4 4 0 0 0 12 5a4 4 0 0 0-4 3.5" /><path d="M23 4v6h-6M1 20v-6h6" /></svg>
          </button>
        ) : <div style={{ width: '36px' }} />}
      </div>

      {/* Main content */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '420px', height: '100%', overflow: 'hidden', margin: '0 auto' }}>
        {mode === 'camera' && (
          <>
            {cameraError ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={1.5}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                <p style={{ color: '#9494AC', fontSize: '14px', textAlign: 'center', marginTop: '16px' }}>{cameraError}</p>
                <button onClick={startCamera} style={{
                  marginTop: '16px', padding: '10px 20px', borderRadius: '10px', background: '#FF6B35', color: '#0A0A0F', fontWeight: 700, border: 'none', cursor: 'pointer',
                }}>Tentar Novamente</button>
              </div>
            ) : (
              <video ref={videoRef} autoPlay playsInline muted style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              }} />
            )}

            {/* Timer */}
            {recording && (
              <div style={{
                position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 10,
                background: 'rgba(255,77,106,0.9)', borderRadius: '20px', padding: '6px 16px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', animation: 'blink 1s infinite' }} />
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatTime(recordTime)}</span>
              </div>
            )}

            {/* Record button */}
            <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
              <button onClick={toggleRecording} style={{
                width: '72px', height: '72px', borderRadius: '50%', background: 'transparent',
                border: `4px solid ${recording ? '#FF4D6A' : '#fff'}`, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: recording ? '28px' : '58px', height: recording ? '28px' : '58px',
                  borderRadius: recording ? '6px' : '50%', background: '#FF4D6A', transition: 'all 200ms',
                }} />
              </button>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>
                {recording ? 'Toque para parar' : 'Toque para gravar'}
              </p>
            </div>
          </>
        )}

        {mode === 'preview' && previewUrl && (
          <>
            <video src={previewUrl} autoPlay loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

            {/* Caption */}
            <div style={{ position: 'absolute', bottom: '100px', left: '16px', right: '16px', zIndex: 10 }}>
              <input
                type="text" value={caption} onChange={e => setCaption(e.target.value)}
                placeholder="Adicionar legenda..." maxLength={300}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '24px',
                  background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff', fontSize: '14px', outline: 'none', backdropFilter: 'blur(8px)', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Actions */}
            <div style={{
              position: 'absolute', bottom: '30px', left: '16px', right: '16px', zIndex: 10,
              display: 'flex', gap: '12px',
            }}>
              <button onClick={retake} style={{
                flex: 1, padding: '14px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)',
              }}>Refazer</button>
              <button onClick={publish} disabled={uploading} style={{
                flex: 2, padding: '14px', borderRadius: '12px',
                background: '#FF6B35', border: 'none', color: '#0A0A0F', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', opacity: uploading ? 0.7 : 1,
              }}>{uploading ? 'Publicando...' : 'Publicar Cut'}</button>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', pointerEvents: 'none', zIndex: 5 }} />
          </>
        )}
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
