'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEASettings } from '../_components/use-ea-settings';
import { buildEAPreview } from '@/lib/ea-settings-helpers';

export default function EALogin() {
  const { eaName } = useEASettings();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/ea/auth', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push('/ea/dashboard');
    } else {
      setError('Wrong password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-sm p-8">
        <h1 className="text-white text-2xl font-light mb-2">{eaName}</h1>
        <p className="text-zinc-500 text-sm mb-8">{buildEAPreview(eaName)}</p>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className="w-full bg-zinc-900 text-white border border-zinc-800 rounded-lg px-4 py-3 mb-4 outline-none focus:border-zinc-600"
        />
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-white text-black rounded-lg py-3 font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {loading ? 'Entering...' : 'Enter'}
        </button>
      </div>
    </div>
  );
}