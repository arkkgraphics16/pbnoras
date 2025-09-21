import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth, db } from '../firebase.js';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

function AuthGate() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setError('');
    setInfo('');
  }, [mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        await ensureUserProfile(credentials.user);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Enter your email to reset your password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo('Password reset email sent.');
    } catch (err) {
      setError(err.message || 'Unable to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-gate">
      <div className="auth-card">
        <h1>PBN Kron</h1>
        <p className="auth-subtitle">Plan, broadcast, and nail your goals.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="auth-label">
            Password
            <input
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {mode === 'signup' && (
            <label className="auth-label">
              Confirm Password
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </label>
          )}
          {error && <p className="auth-error">{error}</p>}
          {info && <p className="auth-info">{info}</p>}
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signup' ? 'Sign up' : 'Sign in'}
          </button>
        </form>
        <div className="auth-actions">
          {mode === 'signin' ? (
            <p>
              Need an account?{' '}
              <button type="button" onClick={() => setMode('signup')}>
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already onboard?{' '}
              <button type="button" onClick={() => setMode('signin')}>
                Sign in
              </button>
            </p>
          )}
          <button type="button" onClick={handleResetPassword} disabled={loading}>
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
}

async function ensureUserProfile(user) {
  const userRef = doc(db, 'users', user.uid);
  const defaultUsername = (user.email || '').split('@')[0] || 'Member';
  await setDoc(
    userRef,
    {
      email: user.email,
      username: defaultUsername,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export default AuthGate;
