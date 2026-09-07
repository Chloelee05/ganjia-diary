'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'signup' && password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않아요.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 해요.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError('이메일 또는 비밀번호가 틀렸어요.');
        setLoading(false);
      } else {
        router.push('/');
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(
          error.message.includes('already registered')
            ? '이미 가입된 이메일이에요. 로그인해주세요.'
            : `가입 실패: ${error.message}`
        );
        setLoading(false);
      } else {
        // 이메일 확인 OFF 상태면 바로 로그인됨
        setMessage('가입 완료! 로그인 중...');
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 800);
      }
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

  const isReady = email && password && (mode === 'login' || passwordConfirm);

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
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.15em' }}>
            六十甲子
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '6px' }}>
            일진(日辰) 일기
          </p>
        </div>

        {/* 모드 탭 */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            marginBottom: '28px',
          }}
        >
          {(['login', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setMessage(''); }}
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '13px',
                background: 'none',
                border: 'none',
                borderBottom: mode === m ? '2px solid var(--text-ink)' : '2px solid transparent',
                marginBottom: '-1px',
                color: mode === m ? 'var(--text-ink)' : 'var(--text-faint)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'color 0.1s',
              }}
            >
              {m === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          {mode === 'signup' && (
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              style={inputStyle}
            />
          )}

          {error && (
            <p style={{ fontSize: '12px', color: '#b84030', textAlign: 'center', lineHeight: 1.5 }}>
              {error}
            </p>
          )}
          {message && (
            <p style={{ fontSize: '12px', color: '#3a6b4a', textAlign: 'center' }}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !isReady}
            style={{
              marginTop: '4px',
              padding: '11px',
              background: isReady ? 'var(--text-ink)' : 'var(--border)',
              color: isReady ? '#fff' : 'var(--text-faint)',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'inherit',
              cursor: isReady ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            {loading
              ? (mode === 'login' ? '로그인 중...' : '가입 중...')
              : (mode === 'login' ? '로그인' : '가입하기')}
          </button>
        </form>
      </div>
    </div>
  );
}
