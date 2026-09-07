'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      style={{
        fontSize: '12px',
        color: 'var(--text-faint)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px 8px',
        fontFamily: 'inherit',
      }}
      className="hover:opacity-60 transition-opacity"
    >
      로그아웃
    </button>
  );
}
