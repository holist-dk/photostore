'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage('Check your email to confirm your account!');
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '600',
              letterSpacing: '-0.5px',
              marginBottom: '8px',
            }}
          >
            📷 PhotoStore
          </div>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Your private media vault
          </p>
        </div>
        <div
          style={{
            background: '#111',
            border: '1px solid #222',
            borderRadius: '16px',
            padding: '28px',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '24px',
            }}
          >
            {isSignup ? 'Create account' : 'Sign in'}
          </h2>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          {error && (
            <p
              style={{ color: '#f87171', fontSize: '13px', marginTop: '12px' }}
            >
              {error}
            </p>
          )}
          {message && (
            <p
              style={{ color: '#4ade80', fontSize: '13px', marginTop: '12px' }}
            >
              {message}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            style={{
              width: '100%',
              marginTop: '20px',
              background: '#f0f0f0',
              color: '#0a0a0a',
              padding: '12px',
              fontWeight: '600',
              fontSize: '15px',
              borderRadius: '10px',
            }}
          >
            {loading
              ? 'Please wait...'
              : isSignup
              ? 'Create account'
              : 'Sign in'}
          </button>
          <p
            style={{
              textAlign: 'center',
              marginTop: '16px',
              fontSize: '13px',
              color: '#666',
            }}
          >
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
                setMessage('');
              }}
              style={{
                background: 'none',
                color: '#aaa',
                textDecoration: 'underline',
                padding: 0,
                fontSize: '13px',
              }}
            >
              {isSignup ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
