import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useChallengeStore from '../store/challengeStore';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

const RULES = [
  { icon: 'directions_run', text: '2 workouts (1 outdoor)' },
  { icon: 'water_drop', text: '1 gallon of water' },
  { icon: 'menu_book', text: '10 pages non-fiction' },
  { icon: 'restaurant', text: 'Follow a diet' },
  { icon: 'no_drinks', text: 'Zero alcohol' },
  { icon: 'photo_camera', text: 'Progress photo' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { createChallenge, isLoading } = useChallengeStore();

  const handleStart = async () => {
    try {
      await createChallenge(new Date().toISOString().split('T')[0]);
      navigate('/');
    } catch {
      // error handled in store
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12">
      {/* Hero */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="text-center max-w-lg"
      >
        <p className="label-text text-on-surface-variant mb-4 tracking-widest">75 hard protocol</p>
        <h1 className="font-display font-black text-on-surface text-5xl md:text-7xl uppercase tracking-tight leading-none">
          Stay the{' '}
          <span className="text-primary italic">course.</span>
        </h1>
      </motion.div>

      {/* Day counter */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mt-10 text-center"
      >
        <div className="font-display font-black text-primary text-7xl md:text-9xl leading-none">
          DAY 0
        </div>
        <p className="font-display text-on-surface-variant text-xl md:text-2xl mt-1">/ 75</p>
      </motion.div>

      {/* CTA */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="mt-10">
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="performance-gradient text-bg font-display font-black text-sm uppercase tracking-widest rounded-lg px-10 py-4 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isLoading ? 'Initializing...' : 'Start Protocol'}
        </button>
      </motion.div>

      {/* Bento grid */}
      <motion.div
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mt-16 w-full max-w-lg grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Progress card */}
        <div className="glass-panel rounded-xl p-6 border border-outline/15">
          <p className="label-text text-on-surface-variant mb-3 tracking-widest">progress</p>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-display font-black text-primary text-3xl">0%</span>
            <span className="text-on-surface-variant text-sm">complete</span>
          </div>
          {/* Progress bar */}
          <div className="h-[3px] bg-surface-higher rounded-full overflow-hidden">
            <div className="h-full w-0 bg-primary rounded-full" />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-outline">Day 0</span>
            <span className="text-[10px] text-outline">Day 75</span>
          </div>
        </div>

        {/* Daily rules card */}
        <div className="glass-panel rounded-xl p-6 border border-outline/15">
          <p className="label-text text-on-surface-variant mb-3 tracking-widest">daily rules</p>
          <ul className="space-y-2.5">
            {RULES.map((rule) => (
              <li key={rule.icon} className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                  {rule.icon}
                </span>
                <span className="text-on-surface text-sm">{rule.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Bottom link */}
      <motion.p
        custom={4}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mt-12 text-on-surface-variant text-sm"
      >
        Already started?{' '}
        <button
          onClick={() => navigate('/login')}
          className="text-primary hover:text-primary-container transition-colors"
        >
          Resume protocol
        </button>
      </motion.p>
    </div>
  );
}
