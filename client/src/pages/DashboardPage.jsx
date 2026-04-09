import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import ProgressRing from '../components/ProgressRing';
import StatCard from '../components/StatCard';
import useChallengeStore from '../store/challengeStore';
import useSettingsStore from '../store/settingsStore';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

const TASKS = [
  { key: 'workout1', label: 'Workout 1 (outdoor)', icon: 'directions_run', type: 'exercise' },
  { key: 'workout2', label: 'Workout 2', icon: 'fitness_center', type: 'exercise' },
  { key: 'water', label: 'Water intake', icon: 'water_drop', type: 'hydration', unit: 'cups', target: 16 },
  { key: 'reading', label: 'Reading', icon: 'menu_book', type: 'learning', unit: 'pages', target: 10 },
  { key: 'photo', label: 'Progress picture', icon: 'photo_camera', type: 'tracking' },
  { key: 'diet', label: 'Diet compliance', icon: 'restaurant', type: 'nutrition' },
];

function TaskCard({ task, completed, value, index }) {
  const navigate = useNavigate();
  const isWater = task.key === 'water';
  const progress = isWater && task.target ? Math.min((value || 0) / task.target, 1) : 0;

  return (
    <motion.button
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      onClick={() => navigate('/log')}
      className={`w-full glass-panel rounded-lg p-4 border-l-4 text-left transition-colors hover:border-primary/60 ${
        completed
          ? 'border-l-primary/40 opacity-60'
          : 'border-l-outline/30'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`material-symbols-outlined text-[22px] ${
            completed ? 'text-primary' : 'text-on-surface-variant'
          }`}
        >
          {completed ? 'check_circle' : task.icon}
        </span>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium ${
              completed ? 'text-on-surface-variant line-through' : 'text-on-surface'
            }`}
          >
            {task.label}
          </p>
          <p className="label-text text-outline mt-0.5">{task.type}</p>
        </div>

        {isWater && (
          <span className="text-xs font-body text-on-surface-variant">
            {value || 0}/{task.target} {task.unit}
          </span>
        )}
        {task.key === 'reading' && (
          <span className="text-xs font-body text-on-surface-variant">
            {value || 0} {task.unit}
          </span>
        )}
      </div>

      {/* Water progress bar */}
      {isWater && (
        <div className="mt-3 h-[3px] bg-surface-higher rounded-full overflow-hidden">
          <div
            className="h-full bg-tertiary rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </motion.button>
  );
}

function ConsistencyWave({ logs }) {
  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const log = logs?.find((l) => l.date?.startsWith(dateStr));
      let count = 0;
      if (log) {
        if (log.workout1Complete) count++;
        if (log.workout2Complete) count++;
        if (log.waterComplete) count++;
        if (log.readingComplete) count++;
        if (log.dietCompliant) count++;
      }
      result.push({
        date: d,
        day: d.toLocaleDateString('en', { weekday: 'short' }).charAt(0),
        count,
        total: 5,
      });
    }
    return result;
  }, [logs]);

  return (
    <div className="flex items-end gap-2 h-24">
      {days.map((d, i) => {
        const ratio = d.total > 0 ? d.count / d.total : 0;
        const height = Math.max(ratio * 100, 6);
        let barClass = 'bg-surface-higher';
        if (ratio >= 1) barClass = 'bg-primary';
        else if (ratio > 0) barClass = 'bg-secondary';

        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end justify-center" style={{ height: '72px' }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className={`w-full max-w-[20px] rounded-sm ${barClass}`}
              />
            </div>
            <span className="text-[10px] text-outline">{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    challenges,
    challenge,
    dayLog,
    isLoading,
    fetchChallenges,
    fetchTodayLog,
    createChallenge,
  } = useChallengeStore();
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    fetchChallenges();
    fetchSettings().catch(() => {});
  }, [fetchChallenges, fetchSettings]);

  // Find active challenge
  const activeChallenge = challenge || challenges?.find((c) => c.status === 'active');

  useEffect(() => {
    if (activeChallenge?.id) {
      fetchTodayLog(activeChallenge.id);
    }
  }, [activeChallenge?.id, fetchTodayLog]);

  const dayNumber = activeChallenge?.currentDay || 1;
  const totalDays = settings?.challengeDays || 75;
  const completedDays = activeChallenge?.completedDays || 0;
  const percentage = Math.round((completedDays / totalDays) * 100);
  const streak = completedDays; // simplified streak = completed days
  const completionRate = dayNumber > 1 ? Math.round((completedDays / (dayNumber - 1)) * 100) : 0;

  // Build completion map from dayLog fields
  const completions = useMemo(() => {
    if (!dayLog) return {};
    return {
      workout1: { completed: dayLog.workout1Complete, value: dayLog.workout1Duration },
      workout2: { completed: dayLog.workout2Complete, value: dayLog.workout2Duration },
      water: { completed: dayLog.waterComplete, value: dayLog.waterIntake },
      reading: { completed: dayLog.readingComplete, value: dayLog.pagesRead },
      photo: { completed: !!dayLog.progressPhotoUrl },
      diet: { completed: dayLog.dietCompliant },
    };
  }, [dayLog]);

  const handleStartProtocol = async () => {
    try {
      await createChallenge(new Date().toISOString().split('T')[0]);
    } catch {
      // error handled in store
    }
  };

  // No active challenge state
  if (!isLoading && !activeChallenge) {
    return (
      <Layout>
        <LandingHero onStart={handleStartProtocol} isLoading={isLoading} totalDays={totalDays} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8 pb-8">
        {/* Hero */}
        <motion.section custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <h1 className="font-display font-black text-primary text-3xl md:text-4xl uppercase tracking-tight">
            Push the Limit
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">Daily mission control</p>
        </motion.section>

        {/* Progress Ring */}
        <motion.section
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center py-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
          >
            <div className="relative inline-flex items-center justify-center">
              <ProgressRing percentage={percentage} size={180} strokeWidth={8} showLabel={false} />
              <div className="absolute flex flex-col items-center leading-tight">
                <span className="font-display font-black text-primary text-lg leading-none">
                  DAY {dayNumber}
                </span>
                <span className="font-display font-black text-primary text-3xl leading-none mt-0.5">
                  {Math.round(percentage)}%
                </span>
                <span className="text-on-surface-variant text-xs mt-0.5">/{totalDays}</span>
              </div>
            </div>
          </motion.div>
          <p className="label-text text-on-surface-variant mt-4">Stay the course</p>
        </motion.section>

        {/* Stat Cards */}
        <motion.section custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
            <div className="min-w-[150px] flex-1">
              <StatCard
                label="Day streak"
                value={streak}
                icon="local_fire_department"
                color="#f4ffc6"
              />
            </div>
            <div className="min-w-[150px] flex-1">
              <StatCard
                label="Completed"
                value={completedDays}
                icon="check_circle"
                color="#ff734a"
              />
            </div>
            <div className="min-w-[150px] flex-1">
              <StatCard
                label="Rate"
                value={`${completionRate}%`}
                icon="trending_up"
                color="#81ecff"
              />
            </div>
          </div>
        </motion.section>

        {/* Daily Execution */}
        <motion.section custom={3} variants={fadeUp} initial="hidden" animate="visible">
          <p className="label-text text-on-surface-variant mb-3 tracking-widest">
            daily execution
          </p>
          <div className="space-y-2">
            {TASKS.map((task, i) => {
              const c = completions[task.key] || {};
              return (
                <TaskCard
                  key={task.key}
                  task={task}
                  completed={!!c.completed}
                  value={c.value}
                  index={i + 4}
                />
              );
            })}
          </div>
        </motion.section>

        {/* Consistency Wave */}
        <motion.section custom={5} variants={fadeUp} initial="hidden" animate="visible">
          <p className="label-text text-on-surface-variant mb-3 tracking-widest">
            consistency wave
          </p>
          <div className="glass-panel rounded-lg p-4">
            <ConsistencyWave logs={activeChallenge?.logs || []} />
          </div>
        </motion.section>

        {/* Quick Actions */}
        <motion.section custom={6} variants={fadeUp} initial="hidden" animate="visible">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/log')}
              className="glass-panel rounded-lg p-4 border border-outline/20 hover:border-primary/40 transition-colors text-center"
            >
              <span className="material-symbols-outlined text-secondary text-[28px] mb-1">
                restaurant
              </span>
              <p className="label-text text-on-surface-variant">Diet Log</p>
            </button>
            <button
              onClick={() => navigate('/log')}
              className="glass-panel rounded-lg p-4 border border-outline/20 hover:border-primary/40 transition-colors text-center"
            >
              <span className="material-symbols-outlined text-error text-[28px] mb-1">
                no_drinks
              </span>
              <p className="label-text text-on-surface-variant">Zero Alcohol</p>
            </button>
          </div>
        </motion.section>

        {/* Latest Progress Photo */}
        {dayLog?.progressPhotoUrl && (
          <motion.section custom={7} variants={fadeUp} initial="hidden" animate="visible">
            <p className="label-text text-on-surface-variant mb-3 tracking-widest">
              latest capture
            </p>
            <div className="glass-panel rounded-lg overflow-hidden">
              <img
                src={dayLog.progressPhotoUrl}
                alt="Progress"
                className="w-full h-48 object-cover grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
          </motion.section>
        )}
      </div>
    </Layout>
  );
}

/* Inline landing hero for when no active challenge exists */
function LandingHero({ onStart, isLoading, totalDays = 75 }) {
  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <p className="label-text text-on-surface-variant mb-4">75 HARD</p>
        <h1 className="font-display font-black text-on-surface text-4xl md:text-6xl uppercase tracking-tight leading-none">
          Stay the{' '}
          <span className="text-primary italic">course.</span>
        </h1>
        <p className="text-on-surface-variant mt-4 text-sm max-w-xs mx-auto">
          No shortcuts. No excuses. Define your rules and execute.
        </p>

        <div className="mt-8 font-display font-black text-primary text-6xl md:text-8xl">
          DAY 0 <span className="text-on-surface-variant text-2xl md:text-3xl">/ {totalDays}</span>
        </div>

        <button
          onClick={onStart}
          disabled={isLoading}
          className="mt-8 performance-gradient text-bg font-display font-black text-sm uppercase tracking-widest rounded-lg px-8 py-4 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isLoading ? 'Initializing...' : 'Start Protocol'}
        </button>
      </motion.div>
    </div>
  );
}
