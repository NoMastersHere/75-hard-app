import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import useChallengeStore from '../store/challengeStore';
import api from '../api/client';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const DIET_OPTIONS = ['Standard', 'Keto', 'Vegan', 'Paleo', 'Custom'];

function Stepper({ value, onChange, min, max, step = 1, unit = '', formatValue }) {
  const display = formatValue ? formatValue(value) : value;
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}
        className="w-9 h-9 rounded-lg bg-surface-higher border border-outline/30 text-on-surface-variant hover:border-primary/40 transition-colors flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-base">remove</span>
      </button>
      <span className="font-display font-black text-lg text-on-surface min-w-[56px] text-center">
        {display}{unit && <span className="text-on-surface-variant text-xs font-body font-normal ml-1">{unit}</span>}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))}
        className="w-9 h-9 rounded-lg bg-surface-higher border border-outline/30 text-on-surface-variant hover:border-primary/40 transition-colors flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-base">add</span>
      </button>
    </div>
  );
}

function ToggleSwitch({ active, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 ${
        active ? 'bg-primary' : 'bg-surface-highest'
      }`}
    >
      <motion.div
        className="w-5 h-5 rounded-full bg-bg shadow"
        animate={{ x: active ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

function SectionLabel({ children, color }) {
  return (
    <p className={`label-text mb-3 ${color || 'text-on-surface-variant'}`}>{children}</p>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { settings, fetchSettings, updateSettings } = useSettingsStore();
  const { challenges, fetchChallenges, challenge, resetChallenge, isLoading } = useChallengeStore();

  // Local settings state
  const [challengeDays, setChallengeDays] = useState(75);
  const [workoutDuration, setWorkoutDuration] = useState(45);
  const [hydrationGoal, setHydrationGoal] = useState(1);
  const [readingPages, setReadingPages] = useState(10);
  const [dietType, setDietType] = useState('Standard');

  const [notifTasks, setNotifTasks] = useState(true);
  const [notifHydration, setNotifHydration] = useState(true);
  const [notifPhoto, setNotifPhoto] = useState(false);

  const [activeTab, setActiveTab] = useState('protocol');

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const debounceRef = useRef(null);

  // Load data on mount
  useEffect(() => {
    fetchSettings().catch(() => {});
    fetchChallenges().catch(() => {});
  }, [fetchSettings, fetchChallenges]);

  // Populate from fetched settings
  useEffect(() => {
    if (!settings) return;
    if (settings.challengeDays != null) setChallengeDays(settings.challengeDays);
    if (settings.workoutDuration != null) setWorkoutDuration(settings.workoutDuration);
    if (settings.hydrationGoal != null) setHydrationGoal(settings.hydrationGoal);
    if (settings.readingGoal != null) setReadingPages(settings.readingGoal);
    if (settings.dietConstraint) setDietType(settings.dietConstraint);
    if (settings.reminderTasks != null) setNotifTasks(settings.reminderTasks);
    if (settings.reminderHydration != null) setNotifHydration(settings.reminderHydration);
    if (settings.reminderPhoto != null) setNotifPhoto(settings.reminderPhoto);
  }, [settings]);

  // Debounced auto-save
  const autoSave = useCallback(
    (updates) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateSettings(updates).catch(() => {});
      }, 800);
    },
    [updateSettings]
  );

  const handleChallengeDays = (v) => {
    setChallengeDays(v);
    autoSave({ challengeDays: v });
  };
  const handleWorkoutDuration = (v) => {
    setWorkoutDuration(v);
    autoSave({ workoutDuration: v });
  };
  const handleHydrationGoal = (v) => {
    setHydrationGoal(v);
    autoSave({ hydrationGoal: v });
  };
  const handleReadingPages = (v) => {
    setReadingPages(v);
    autoSave({ readingGoal: v });
  };
  const handleDietType = (v) => {
    setDietType(v);
    autoSave({ dietConstraint: v });
  };
  const handleNotifTasks = () => {
    const next = !notifTasks;
    setNotifTasks(next);
    autoSave({ reminderTasks: next });
  };
  const handleNotifHydration = () => {
    const next = !notifHydration;
    setNotifHydration(next);
    autoSave({ reminderHydration: next });
  };
  const handleNotifPhoto = () => {
    const next = !notifPhoto;
    setNotifPhoto(next);
    autoSave({ reminderPhoto: next });
  };

  const activeChallenge = challenge || challenges?.find((c) => c.status === 'active');

  const handleReset = async () => {
    if (!activeChallenge?.id) return;
    try {
      await resetChallenge(activeChallenge.id);
      setResetDone(true);
      setShowResetConfirm(false);
      setTimeout(() => setResetDone(false), 3000);
    } catch {
      // error handled by store
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || '??';

  return (
    <Layout>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto pb-24 lg:pb-8 space-y-5"
      >
        {/* Header */}
        <motion.div variants={fadeUp}>
          <h1 className="font-display font-black text-primary text-3xl sm:text-4xl uppercase tracking-tight">
            Settings
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">Configure your protocol</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          variants={fadeUp}
          className="glass-panel rounded-xl p-6 border border-outline/15 flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-surface-higher border-2 border-primary/30 flex items-center justify-center shrink-0">
            <span className="font-display font-black text-xl text-primary">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-on-surface text-lg truncate">
              {user?.name || 'Operator'}
            </p>
            <p className="text-on-surface-variant text-sm truncate">{user?.email || ''}</p>
            <span className="inline-block mt-1.5 bg-surface-higher text-primary-container text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
              Protocol Member
            </span>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div variants={fadeUp} className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('protocol')}
            className={`flex-1 py-3 rounded-lg font-display font-bold text-sm uppercase tracking-wider transition-all ${
              activeTab === 'protocol'
                ? 'bg-primary text-bg'
                : 'bg-surface-higher text-on-surface-variant border border-outline/30 hover:border-primary/40'
            }`}
          >
            <span className="material-symbols-outlined text-base align-middle mr-1.5">tune</span>
            Protocol
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-3 rounded-lg font-display font-bold text-sm uppercase tracking-wider transition-all ${
              activeTab === 'account'
                ? 'bg-primary text-bg'
                : 'bg-surface-higher text-on-surface-variant border border-outline/30 hover:border-primary/40'
            }`}
          >
            <span className="material-symbols-outlined text-base align-middle mr-1.5">person</span>
            Account
          </button>
        </motion.div>

        {activeTab === 'protocol' && (<>
        {/* Protocol Configuration */}
        <motion.div variants={fadeUp} className="glass-panel rounded-xl p-5 border border-outline/15 space-y-5">
          <SectionLabel>protocol configuration</SectionLabel>

          {/* Challenge Days */}
          <div className="bg-surface-higher rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-on-surface text-sm font-semibold">Challenge Length</p>
              <p className="text-on-surface-variant text-xs mt-0.5">Total days in your challenge</p>
            </div>
            <Stepper
              value={challengeDays}
              onChange={handleChallengeDays}
              min={7}
              max={365}
              step={1}
              unit="days"
            />
          </div>

          {/* Workout Duration */}
          <div className="bg-surface-higher rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-on-surface text-sm font-semibold">Workout Duration</p>
              <p className="text-on-surface-variant text-xs mt-0.5">Per session minimum</p>
            </div>
            <Stepper
              value={workoutDuration}
              onChange={handleWorkoutDuration}
              min={15}
              max={120}
              step={5}
              unit="min"
            />
          </div>

          {/* Hydration Goal */}
          <div className="bg-surface-higher rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-on-surface text-sm font-semibold">Hydration Goal</p>
              <p className="text-on-surface-variant text-xs mt-0.5">Daily water target</p>
            </div>
            <Stepper
              value={hydrationGoal}
              onChange={handleHydrationGoal}
              min={0.5}
              max={2}
              step={0.25}
              unit="gal"
            />
          </div>

          {/* Reading Pages */}
          <div className="bg-surface-higher rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-on-surface text-sm font-semibold">Reading Pages</p>
              <p className="text-on-surface-variant text-xs mt-0.5">Daily reading minimum</p>
            </div>
            <Stepper
              value={readingPages}
              onChange={handleReadingPages}
              min={5}
              max={50}
              step={5}
              unit="pg"
            />
          </div>

          {/* Diet Constraint */}
          <div className="bg-surface-higher rounded-lg p-4">
            <p className="text-on-surface text-sm font-semibold mb-2">Diet Constraint</p>
            <div className="flex flex-wrap gap-2">
              {DIET_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleDietType(opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                    dietType === opt
                      ? 'bg-primary text-bg'
                      : 'bg-surface-highest text-on-surface-variant border border-outline/30 hover:border-primary/40'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={fadeUp} className="glass-panel rounded-xl p-5 border border-outline/15 space-y-4">
          <SectionLabel>notifications</SectionLabel>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-on-surface text-sm font-semibold">Critical Task Reminders</p>
              <p className="text-on-surface-variant text-xs mt-0.5">Alerts for incomplete daily tasks</p>
            </div>
            <ToggleSwitch active={notifTasks} onToggle={handleNotifTasks} />
          </div>

          <div className="border-t border-outline/15" />

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-on-surface text-sm font-semibold">Hydration Nudges</p>
              <p className="text-on-surface-variant text-xs mt-0.5">Periodic water intake reminders</p>
            </div>
            <ToggleSwitch active={notifHydration} onToggle={handleNotifHydration} />
          </div>

          <div className="border-t border-outline/15" />

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-on-surface text-sm font-semibold">Progress Photo Alert</p>
              <p className="text-on-surface-variant text-xs mt-0.5">Daily reminder to capture progress</p>
            </div>
            <ToggleSwitch active={notifPhoto} onToggle={handleNotifPhoto} />
          </div>
        </motion.div>

        {/* Legacy Log */}
        <motion.div variants={fadeUp} className="glass-panel rounded-xl p-5 border border-outline/15">
          <SectionLabel>legacy log</SectionLabel>
          {challenges.length > 0 ? (
            <div className="space-y-3">
              {challenges.map((ch) => {
                const isComplete = ch.status === 'completed' || ch.completedAt;
                const isFailed = ch.status === 'failed';
                const startStr = ch.startDate
                  ? new Date(ch.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Unknown';
                return (
                  <div
                    key={ch.id}
                    className="bg-surface-higher rounded-lg p-4 flex items-center gap-3"
                  >
                    <div
                      className={`w-3 h-3 rounded-full shrink-0 ${
                        isComplete
                          ? 'bg-primary-container'
                          : isFailed
                          ? 'bg-error'
                          : 'bg-on-surface-variant'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-on-surface text-sm font-semibold truncate">
                        {ch.name || '75 Hard Challenge'}
                      </p>
                      <p className="text-on-surface-variant text-xs">
                        {startStr} &middot; {ch.completedDays || ch.currentDay || '?'} days
                        {isComplete && ' \u00b7 Completed'}
                        {isFailed && ' \u00b7 Failed'}
                        {!isComplete && !isFailed && ch.status === 'active' && ' \u00b7 Active'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-on-surface-variant text-sm">No challenge history yet.</p>
          )}
        </motion.div>

        {/* Danger Zone */}
        <motion.div variants={fadeUp} className="glass-panel rounded-xl p-5 border border-error/30">
          <SectionLabel color="text-error">danger zone</SectionLabel>

          <AnimatePresence mode="wait">
            {!showResetConfirm ? (
              <motion.button
                key="reset-btn"
                type="button"
                onClick={() => setShowResetConfirm(true)}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full py-3 rounded-lg bg-error/10 border border-error/30 text-error font-display font-bold text-sm uppercase tracking-wider hover:bg-error/20 transition-colors"
              >
                <span className="material-symbols-outlined text-base align-middle mr-2">warning</span>
                Emergency Reset
              </motion.button>
            ) : (
              <motion.div
                key="reset-confirm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <p className="text-error text-sm">
                  This will reset your current challenge progress. Day count returns to 1.
                  History is preserved.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-3 rounded-lg bg-surface-higher border border-outline/30 text-on-surface-variant font-display font-bold text-sm uppercase tracking-wider hover:border-outline/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-lg bg-error text-bg font-display font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="material-symbols-outlined text-bg text-lg animate-spin">
                        progress_activity
                      </span>
                    ) : (
                      'Confirm Reset'
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {resetDone && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-primary-container text-sm mt-3 text-center"
            >
              Challenge reset. Day 1 begins now.
            </motion.p>
          )}
        </motion.div>

        {/* Logout */}
        <motion.div variants={fadeUp}>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 rounded-lg border border-outline/30 text-on-surface-variant font-display font-bold text-sm uppercase tracking-wider hover:border-primary/40 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-base align-middle mr-2">logout</span>
            Disconnect
          </button>
        </motion.div>
        </>)}

        {activeTab === 'account' && (
          <AccountSettings />
        )}
      </motion.div>
    </Layout>
  );
}

function AccountSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFeedback({ type: 'error', message: 'All fields are required.' });
      return;
    }
    if (newPassword.length < 8) {
      setFeedback({ type: 'error', message: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setFeedback({ type: 'success', message: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to change password.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div variants={fadeUp} className="glass-panel rounded-xl p-5 border border-outline/15 space-y-5">
        <SectionLabel>change password</SectionLabel>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="text-on-surface text-sm font-semibold block mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-surface-higher border border-outline/30 rounded-lg px-4 py-3 pr-12 text-on-surface text-sm placeholder:text-outline/50 focus:border-primary/50 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-lg">
                  {showCurrent ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="text-on-surface text-sm font-semibold block mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full bg-surface-higher border border-outline/30 rounded-lg px-4 py-3 pr-12 text-on-surface text-sm placeholder:text-outline/50 focus:border-primary/50 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-lg">
                  {showNew ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="text-on-surface text-sm font-semibold block mb-1.5">
              Confirm New Password
            </label>
            <input
              type={showNew ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full bg-surface-higher border border-outline/30 rounded-lg px-4 py-3 text-on-surface text-sm placeholder:text-outline/50 focus:border-primary/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${
                  feedback.type === 'success'
                    ? 'bg-primary/10 text-primary-container'
                    : 'bg-error/10 text-error'
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {feedback.type === 'success' ? 'check_circle' : 'error'}
                </span>
                {feedback.message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-lg bg-primary text-bg font-display font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? (
              <span className="material-symbols-outlined text-bg text-lg animate-spin">
                progress_activity
              </span>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </motion.div>
    </>
  );
}
