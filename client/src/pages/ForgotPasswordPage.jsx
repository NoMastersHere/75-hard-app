import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
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
        <div className="text-center mb-8">
          <p className="label-text text-on-surface-variant mb-3">75 HARD</p>
          <h1 className="font-display font-black text-primary text-2xl uppercase tracking-tight">
            Reset Access
          </h1>
        </div>

        {submitted ? (
          <div className="text-center">
            <p className="text-on-surface text-sm mb-6">
              If that email is registered, a reset link has been sent. Check your inbox.
            </p>
            <Link
              to="/login"
              className="text-primary hover:text-primary-container transition-colors text-sm"
            >
              Back to login
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
                  'Send Reset Link'
                )}
              </button>
            </form>

            <p className="text-center text-on-surface-variant text-sm mt-6">
              <Link to="/login" className="text-primary hover:text-primary-container transition-colors">
                Back to login
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
