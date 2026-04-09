import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/client';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="glass-panel rounded-xl p-8 w-full max-w-sm border border-outline/20 text-center">
          <p className="text-error text-sm mb-4">Invalid reset link. No token provided.</p>
          <Link to="/forgot-password" className="text-primary text-sm hover:text-primary-container transition-colors">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass-panel rounded-xl p-8 w-full max-w-sm obsidian-glow border border-outline/20"
      >
        <div className="text-center mb-8">
          <p className="label-text text-on-surface-variant mb-3">75 HARD</p>
          <h1 className="font-display font-black text-primary text-2xl uppercase tracking-tight">
            New Password
          </h1>
        </div>

        {success ? (
          <div className="text-center">
            <p className="text-on-surface text-sm mb-4">
              Password reset. Redirecting to login...
            </p>
            <Link to="/login" className="text-primary text-sm hover:text-primary-container transition-colors">
              Go to login now
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-error/10 border border-error/30 rounded-lg px-4 py-3 mb-6">
                <p className="text-error text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-text text-on-surface-variant block mb-1.5">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-surface-higher border border-outline/40 rounded-lg px-4 py-3 text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:border-primary/60 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="label-text text-on-surface-variant block mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-surface-higher border border-outline/40 rounded-lg px-4 py-3 text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:border-primary/60 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full performance-gradient text-bg font-display font-black text-sm uppercase tracking-widest rounded-lg py-3.5 mt-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="material-symbols-outlined text-bg text-lg animate-spin">
                    progress_activity
                  </span>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
