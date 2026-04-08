'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

type Mode = 'camera' | 'preview';
type CaptureMode = 'photo' | 'video';

export default function DropCreator({ onClose, onCreated }: Props) {
  const [mode, setMode] = useState<Mode>('camera');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Close on ESC key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Start camera
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  async function startCamera() {
    setCameraError(null);
    stopCamera();
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1920 },
          aspectRatio: { ideal: 9 / 16 },
        },
        audio: captureMode === 'video',
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Nao foi possivel acessar a camera. Verifique as permissoes.');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  }

  // Take photo
  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontal if using front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      if (blob) {
        setMediaBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setIsVideo(false);
        setMode('preview');
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  }, [facingMode]);

  // Start/Stop video recording
  function toggleRecording() {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function startRecording() {
    if (!streamRef.current) return;

    // Re-init with audio
    if (!streamRef.current.getAudioTracks().length) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(audioStream => {
        const audioTrack = audioStream.getAudioTracks()[0];
        if (audioTrack) streamRef.current?.addTrack(audioTrack);
        beginRecording();
      }).catch(() => beginRecording());
    } else {
      beginRecording();
    }
  }

  function beginRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    try {
      const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setMediaBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setIsVideo(true);
        setMode('preview');
        stopCamera();
      };
      recorder.start(100);
      recorderRef.current = recorder;
      setRecording(true);
      setRecordTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordTime(prev => {
          if (prev >= 30) { // Max 30 seconds
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setCameraError('Gravacao de video nao suportada neste navegador.');
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setRecording(false);
  }

  // Upload & create drop
  async function publishDrop() {
    if (!mediaBlob || uploading) return;
    setUploading(true);
    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', mediaBlob, isVideo ? 'drop.webm' : 'drop.jpg');

      // Use fetch directly for FormData (apiFetch forces Content-Type: json)
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const uploadRes = await fetch('/api/drops/upload', {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { mediaUrl, mediaType } = await uploadRes.json();

      // Create drop
      const createRes = await apiFetch('/api/drops', {
        method: 'POST',
        body: JSON.stringify({
          mediaUrl,
          mediaType,
          caption: caption.trim() || null,
          duration: isVideo ? undefined : 5000,
        }),
      });
      if (createRes.ok) {
        onCreated();
      }
    } catch (err) {
      console.error('Publish error:', err);
    }
    setUploading(false);
  }

  // Retry camera
  function retryPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setMediaBlob(null);
    setPreviewUrl(null);
    setMode('camera');
    startCamera();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#fff', fontSize: '28px',
          cursor: 'pointer', padding: '4px', lineHeight: 1,
        }}>&times;</button>
        {mode === 'camera' && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
              width: '36px', height: '36px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}><path d="M16.5 8.5A4 4 0 0 0 12 5a4 4 0 0 0-4 3.5M23 19l-3-3-3 3M1 5l3 3 3-3" /><path d="M20 16V8a8 8 0 0 0-16 0v8" /></svg>
            </button>
          </div>
        )}
        {mode === 'preview' && (
          <span style={{ color: '#fff', fontSize: '15px', fontWeight: 700 }}>Pré-visualização</span>
        )}
        <div style={{ width: '36px' }} />
      </div>

      {/* Camera / Preview container 9:16 */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: '420px',
        height: '100%', overflow: 'hidden', margin: '0 auto',
      }}>
        {mode === 'camera' && (
          <>
            {cameraError ? (
              <div style={{
                width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', padding: '40px',
              }}>
                <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={1.5}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                <p style={{ color: '#9494AC', fontSize: '14px', textAlign: 'center', marginTop: '16px' }}>{cameraError}</p>
                <button onClick={startCamera} style={{
                  marginTop: '16px', padding: '10px 20px', borderRadius: '10px',
                  background: '#FF6B35', color: '#0A0A0F', fontWeight: 700,
                  border: 'none', cursor: 'pointer', fontSize: '14px',
                }}>Tentar Novamente</button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                }}
              />
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Capture mode tabs */}
            <div style={{
              position: 'absolute', bottom: '120px', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: '20px', zIndex: 10,
            }}>
              {(['photo', 'video'] as CaptureMode[]).map(m => (
                <button key={m} onClick={() => setCaptureMode(m)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: captureMode === m ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontSize: '14px', fontWeight: captureMode === m ? 700 : 500,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: captureMode === m ? '2px solid #fff' : '2px solid transparent',
                  paddingBottom: '4px',
                }}>
                  {m === 'photo' ? 'Foto' : 'Video'}
                </button>
              ))}
            </div>

            {/* Capture button */}
            <div style={{
              position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 10,
            }}>
              {captureMode === 'photo' ? (
                <button onClick={takePhoto} style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  background: 'transparent', border: '4px solid #fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: '58px', height: '58px', borderRadius: '50%', background: '#fff' }} />
                </button>
              ) : (
                <button onClick={toggleRecording} style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  background: 'transparent', border: `4px solid ${recording ? '#FF4D6A' : '#fff'}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: recording ? '28px' : '58px',
                    height: recording ? '28px' : '58px',
                    borderRadius: recording ? '6px' : '50%',
                    background: '#FF4D6A',
                    transition: 'all 200ms',
                  }} />
                </button>
              )}
              {recording && (
                <div style={{
                  position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)',
                  color: '#FF4D6A', fontSize: '14px', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                }}>
                  {recordTime}s / 30s
                </div>
              )}
            </div>
          </>
        )}

        {mode === 'preview' && previewUrl && (
          <>
            {isVideo ? (
              <video
                src={previewUrl}
                autoPlay
                loop
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <img
                src={previewUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}

            {/* Caption input */}
            <div style={{
              position: 'absolute', bottom: '100px', left: '16px', right: '16px', zIndex: 10,
            }}>
              <input
                type="text"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Adicionar legenda..."
                maxLength={200}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '24px',
                  background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff', fontSize: '14px', outline: 'none',
                  backdropFilter: 'blur(8px)', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Actions */}
            <div style={{
              position: 'absolute', bottom: '30px', left: '16px', right: '16px', zIndex: 10,
              display: 'flex', gap: '12px',
            }}>
              <button onClick={retryPreview} style={{
                flex: 1, padding: '14px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                backdropFilter: 'blur(8px)',
              }}>
                Refazer
              </button>
              <button onClick={publishDrop} disabled={uploading} style={{
                flex: 2, padding: '14px', borderRadius: '12px',
                background: '#FF6B35', border: 'none',
                color: '#0A0A0F', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                opacity: uploading ? 0.7 : 1,
              }}>
                {uploading ? 'Publicando...' : 'Publicar Drop'}
              </button>
            </div>

            {/* Gradient overlay bottom */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              pointerEvents: 'none', zIndex: 5,
            }} />
          </>
        )}
      </div>
    </div>
  );
}
