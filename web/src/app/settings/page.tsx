'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getToken, getUser, logout } from '@/lib/api';

type SettingsTab = 'account' | 'privacy' | 'notifications' | 'data' | 'about';

function ShieldIcon() { return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth={1.5}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>; }
function UserIcon() { return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth={1.5}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>; }
function BellIcon() { return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#CCFF00" strokeWidth={1.5}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" /></svg>; }
function DatabaseIcon() { return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth={1.5}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>; }
function InfoIcon() { return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#9494AC" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>; }
function ToggleOn() { return <div style={{ width: '40px', height: '22px', borderRadius: '11px', background: '#FF6B35', position: 'relative', cursor: 'pointer' }}><div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', right: '2px', transition: 'all 200ms' }} /></div>; }
function ToggleOff() { return <div style={{ width: '40px', height: '22px', borderRadius: '11px', background: '#1A1A28', border: '1px solid rgba(148,148,172,0.2)', position: 'relative', cursor: 'pointer' }}><div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#5C5C72', position: 'absolute', top: '2px', left: '2px', transition: 'all 200ms' }} /></div>; }

function SettingRow({ label, description, enabled, onToggle }: { label: string; description?: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(148,148,172,0.06)', cursor: 'pointer' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8' }}>{label}</div>
        {description && <div style={{ fontSize: '12px', color: '#5C5C72', marginTop: '2px' }}>{description}</div>}
      </div>
      {enabled ? <ToggleOn /> : <ToggleOff />}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ displayName?: string; username?: string; email?: string } | null>(null);

  // Settings state
  const [privateProfile, setPrivateProfile] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [likesNotif, setLikesNotif] = useState(true);
  const [commentsNotif, setCommentsNotif] = useState(true);
  const [followsNotif, setFollowsNotif] = useState(true);
  const [workoutNotif, setWorkoutNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    setUser(getUser());
  }, [router]);

  const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { key: 'account', label: 'Conta', icon: <UserIcon /> },
    { key: 'privacy', label: 'Privacidade', icon: <ShieldIcon /> },
    { key: 'notifications', label: 'Notificações', icon: <BellIcon /> },
    { key: 'data', label: 'Meus Dados', icon: <DatabaseIcon /> },
    { key: 'about', label: 'Sobre', icon: <InfoIcon /> },
  ];

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px 80px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F0F0F8', margin: '0 0 20px' }}>Configurações</h1>

        {/* Tabs */}
        <div className="hide-scrollbar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '16px', scrollbarWidth: 'none' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
              borderRadius: '10px', border: '1px solid transparent', cursor: 'pointer',
              fontSize: '13px', fontWeight: activeTab === t.key ? 700 : 500, whiteSpace: 'nowrap',
              background: activeTab === t.key ? 'rgba(255,107,53,0.12)' : '#141420',
              color: activeTab === t.key ? '#FF6B35' : '#9494AC',
              borderColor: activeTab === t.key ? 'rgba(255,107,53,0.25)' : 'rgba(148,148,172,0.08)',
              transition: 'all 200ms',
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Account */}
        {activeTab === 'account' && (
          <div style={{ background: '#141420', borderRadius: '16px', border: '1px solid rgba(148,148,172,0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(148,148,172,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Informações da Conta</div>
            </div>
            {[
              { label: 'Nome', value: user?.displayName || '-' },
              { label: 'Username', value: `@${user?.username || '-'}` },
              { label: 'E-mail', value: user?.email || '-' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(148,148,172,0.06)' }}>
                <span style={{ fontSize: '14px', color: '#9494AC' }}>{item.label}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8' }}>{item.value}</span>
              </div>
            ))}
            <div style={{ padding: '12px 16px' }}>
              <button onClick={() => { if (confirm('Tem certeza que deseja sair?')) logout(); }} style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: '1px solid rgba(255,77,106,0.2)', background: 'transparent',
                color: '#FF4D6A', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}>Sair da Conta</button>
            </div>
          </div>
        )}

        {/* Privacy */}
        {activeTab === 'privacy' && (
          <div style={{ background: '#141420', borderRadius: '16px', border: '1px solid rgba(148,148,172,0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(148,148,172,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Privacidade</div>
            </div>
            <SettingRow label="Perfil privado" description="Apenas seguidores aprovados veem seu conteúdo" enabled={privateProfile} onToggle={() => setPrivateProfile(!privateProfile)} />
            <SettingRow label="Mostrar atividade" description="Outros veem quando você está treinando" enabled={showActivity} onToggle={() => setShowActivity(!showActivity)} />
            <SettingRow label="Status online" description="Mostrar quando você está online" enabled={showOnline} onToggle={() => setShowOnline(!showOnline)} />
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div style={{ background: '#141420', borderRadius: '16px', border: '1px solid rgba(148,148,172,0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(148,148,172,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notificações Push</div>
            </div>
            <SettingRow label="Curtidas" description="Alguém curtiu seu post" enabled={likesNotif} onToggle={() => setLikesNotif(!likesNotif)} />
            <SettingRow label="Comentários" description="Alguém comentou no seu post" enabled={commentsNotif} onToggle={() => setCommentsNotif(!commentsNotif)} />
            <SettingRow label="Novos seguidores" description="Alguém começou a seguir você" enabled={followsNotif} onToggle={() => setFollowsNotif(!followsNotif)} />
            <SettingRow label="Treinos de amigos" description="Amigos completaram um treino" enabled={workoutNotif} onToggle={() => setWorkoutNotif(!workoutNotif)} />
            <SettingRow label="E-mail semanal" description="Resumo semanal por e-mail" enabled={emailNotif} onToggle={() => setEmailNotif(!emailNotif)} />
          </div>
        )}

        {/* Data / LGPD */}
        {activeTab === 'data' && (
          <div>
            <div style={{ background: '#141420', borderRadius: '16px', border: '1px solid rgba(148,148,172,0.08)', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid rgba(148,148,172,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Seus Dados (LGPD)</div>
              </div>
              <div style={{ padding: '16px' }}>
                <p style={{ fontSize: '13px', color: '#9494AC', lineHeight: 1.6, margin: '0 0 16px' }}>
                  Em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a acessar, exportar e solicitar a exclusão dos seus dados pessoais.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button style={{
                    padding: '12px', borderRadius: '10px', border: '1px solid rgba(148,148,172,0.12)',
                    background: 'transparent', color: '#F0F0F8', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    textAlign: 'left',
                  }}>
                    Exportar meus dados (JSON)
                  </button>
                  <button style={{
                    padding: '12px', borderRadius: '10px', border: '1px solid rgba(148,148,172,0.12)',
                    background: 'transparent', color: '#F0F0F8', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    textAlign: 'left',
                  }}>
                    Solicitar relatório de dados
                  </button>
                </div>
              </div>
            </div>
            <div style={{ background: '#141420', borderRadius: '16px', border: '1px solid rgba(255,77,106,0.15)', overflow: 'hidden' }}>
              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#FF4D6A', marginBottom: '6px' }}>Zona de Perigo</div>
                <p style={{ fontSize: '12px', color: '#5C5C72', margin: '0 0 12px' }}>
                  Estas ações são irreversíveis.
                </p>
                <button style={{
                  width: '100%', padding: '12px', borderRadius: '10px',
                  border: '1px solid rgba(255,77,106,0.3)', background: 'rgba(255,77,106,0.05)',
                  color: '#FF4D6A', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}>
                  Solicitar exclusão da conta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* About */}
        {activeTab === 'about' && (
          <div style={{ background: '#141420', borderRadius: '16px', border: '1px solid rgba(148,148,172,0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#FF6B35', fontFamily: "'Orbitron', sans-serif", marginBottom: '4px' }}>GYMFIRE</div>
              <div style={{ fontSize: '12px', color: '#5C5C72', marginBottom: '16px' }}>Versão 1.0.0</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Política de Privacidade', href: '/privacy' },
                  { label: 'Termos de Uso', href: '/terms' },
                  { label: 'Licenças de Código Aberto', href: '#' },
                  { label: 'Contato / Suporte', href: '#' },
                ].map(link => (
                  <a key={link.label} href={link.href} style={{
                    display: 'block', padding: '12px 16px', borderRadius: '10px',
                    border: '1px solid rgba(148,148,172,0.06)', textDecoration: 'none',
                    color: '#9494AC', fontSize: '14px', fontWeight: 500,
                    transition: 'background 150ms',
                  }}>
                    {link.label}
                  </a>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: '#5C5C72', marginTop: '16px' }}>
                © 2026 GymFire. Todos os direitos reservados.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
