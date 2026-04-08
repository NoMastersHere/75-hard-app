import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();

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

    try {
      await register(email, password, name);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.');
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
            Join the Protocol
          </h1>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 rounded-lg px-4 py-3 mb-6">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-text text-on-surface-variant block mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-surface-higher border border-outline/40 rounded-lg px-4 py-3 text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:border-primary/60 transition-colors"
              placeholder="Operator name"
            />
          </div>

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
              'Join the Protocol'
            )}
          </button>
        </form>

        <p className="text-center text-on-surface-variant text-sm mt-6">
          Already enlisted?{' '}
          <Link to="/login" className="text-primary hover:text-primary-container transition-colors">
            Resume protocol
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
