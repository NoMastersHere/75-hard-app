import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Try again.');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass-panel rounded-xl p-8 w-full max-w-sm obsidian-glow border border-outline/20"
      >
        {/* Brand mark */}
        <div className="text-center mb-8">
          <p className="label-text text-on-surface-variant mb-3">75 HARD</p>
          <h1 className="font-display font-black text-primary text-2xl uppercase tracking-tight">
            Resume Protocol
          </h1>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 rounded-lg px-4 py-3 mb-6">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-text text-on-surface-variant block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface-higher border border-outline/40 rounded-lg px-4 py-3 text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:border-primary/60 transition-colors"
              placeholder="operator@protocol.io"
            />
          </div>

          <div>
            <label className="label-text text-on-surface-variant block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              'Resume Protocol'
            )}
          </button>
        </form>

        <p className="text-center text-on-surface-variant text-sm mt-6">
          <Link to="/forgot-password" className="text-primary hover:text-primary-container transition-colors">
            Forgot password?
          </Link>
        </p>

        <p className="text-center text-on-surface-variant text-sm mt-3">
          New operator?{' '}
          <Link to="/signup" className="text-primary hover:text-primary-container transition-colors">
            Join the protocol
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
