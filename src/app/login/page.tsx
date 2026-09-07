'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('이메일 또는 비밀번호가 틀렸어요.');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 0',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--border)',
    fontSize: '14px',
    color: 'var(--text-ink)',
    outline: 'none',
    fontFamily: 'inherit',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-paper)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '320px', padding: '0 24px' }}>

        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p
            style={{
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: 'var(--text-ink)',
            }}
          >
            六十甲子
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '6px' }}>
            일진(日辰) 일기
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          {error && (
            <p style={{ fontSize: '12px', color: '#b84030', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              marginTop: '8px',
              padding: '11px',
              background: email && password ? 'var(--text-ink)' : 'var(--border)',
              color: email && password ? '#fff' : 'var(--text-faint)',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'inherit',
              cursor: email && password ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
