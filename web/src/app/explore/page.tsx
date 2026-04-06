'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';

interface SearchResult {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isVerified?: boolean;
  totalPoints?: number;
}

// Icons
function SearchIcon() { return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>; }

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiFetch(`/api/users/search/${encodeURIComponent(search)}`);
        if (res.ok) setResults(await res.json());
      } catch { /* ignore */ }
      setSearching(false);
    }, 300);
  }, [search]);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px 80px' }}>
        {/* Search bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: '#141420', borderRadius: '14px',
          border: '1px solid rgba(148,148,172,0.08)',
          padding: '12px 16px', marginBottom: '16px',
        }}>
          <SearchIcon />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar usuários, exercícios, hashtags..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#F0F0F8', fontSize: '15px',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              background: 'none', border: 'none', color: '#5C5C72', cursor: 'pointer', fontSize: '18px',
            }}>&times;</button>
          )}
        </div>

        {/* Search results */}
        {search.trim() && (
          <div style={{
            background: '#141420', borderRadius: '14px',
            border: '1px solid rgba(148,148,172,0.08)',
            overflow: 'hidden', marginBottom: '16px',
          }}>
            {searching ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#5C5C72', fontSize: '13px' }}>Buscando...</div>
            ) : results.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#5C5C72', fontSize: '13px' }}>Nenhum resultado para &ldquo;{search}&rdquo;</div>
            ) : (
              results.map((user, i) => (
                <Link key={user.id} href={`/profile/${user.username}`} style={{
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px',
                  borderBottom: i < results.length - 1 ? '1px solid rgba(148,148,172,0.06)' : 'none',
                }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF6B35, #E05520)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '16px', flexShrink: 0,
                  }}>
                    {user.displayName[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8' }}>{user.displayName}</span>
                      {user.isVerified && <span style={{ fontSize: '9px', fontWeight: 800, background: '#FF6B35', color: '#0A0A0F', padding: '1px 5px', borderRadius: '3px' }}>PRO</span>}
                    </div>
                    <span style={{ fontSize: '12px', color: '#9494AC' }}>@{user.username}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {!search.trim() && (
          <>
            {/* Discover grid placeholder */}
            <div style={{
              fontSize: '12px', fontWeight: 700, color: '#5C5C72',
              textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px',
            }}>Descobrir</div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px',
              borderRadius: '12px', overflow: 'hidden',
            }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{
                  aspectRatio: '1', background: '#141420',
                  backgroundImage: `url(https://images.unsplash.com/photo-${['1534438327276-14e5300c3a48', '1571019614242-c5c5dee9f50b', '1526506118085-60ce8714f8c5', '1552674605-db6ffd4facb5', '1583454110551-21f2fa2afe61', '1581009146145-b5ef050c2e1e', '1461896836934-bd45ba448c52', '1605296867304-46d5465a13f1', '1574680096145-d05b474e2155'][i]}?w=300&h=300&fit=crop)`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                }} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
