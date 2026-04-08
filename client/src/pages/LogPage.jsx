import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import useChallengeStore from '../store/challengeStore';
import useSettingsStore from '../store/settingsStore';

const WORKOUT_TYPES = ['OUTDOOR', 'INDOOR', 'GYM'];

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

function Stepper({ value, onChange, min = 0, max = 999, step = 1, unit = '' }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-10 h-10 rounded-lg bg-surface-higher border border-outline/30 text-on-surface-variant hover:border-primary/40 transition-colors flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-lg">remove</span>
      </button>
      <span className="font-display font-black text-xl text-on-surface min-w-[60px] text-center">
        {value}{unit && <span className="text-on-surface-variant text-sm ml-1">{unit}</span>}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        className="w-10 h-10 rounded-lg bg-surface-higher border border-outline/30 text-on-surface-variant hover:border-primary/40 transition-colors flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-lg">add</span>
      </button>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="label-text text-on-surface-variant mb-3">{children}</p>
  );
}

function PillButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-body font-semibold uppercase tracking-wider transition-all ${
        active
          ? 'bg-primary text-bg'
          : 'bg-surface-higher text-on-surface-variant border border-outline/30 hover:border-primary/40'
      }`}
    >
      {children}
    </button>
  );
}

export default function LogPage() {
  const { challenge, challenges, dayLog, fetchChallenges, fetchTodayLog, submitDayLog, isLoading } = useChallengeStore();
  const { settings, fetchSettings } = useSettingsStore();
  const activeChallenge = challenge || challenges?.find((c) => c.status === 'active');

  useEffect(() => {
    if (!challenges.length) fetchChallenges();
    if (!settings) fetchSettings();
  }, []);

  // Form state
  const [workout1Type, setWorkout1Type] = useState('OUTDOOR');
  const [workout1Duration, setWorkout1Duration] = useState(45);
  const [workout1Notes, setWorkout1Notes] = useState('');
  const [workout1Complete, setWorkout1Complete] = useState(false);

  const [workout2Type, setWorkout2Type] = useState('GYM');
  const [workout2Duration, setWorkout2Duration] = useState(45);
  const [workout2Notes, setWorkout2Notes] = useState('');
  const [workout2Complete, setWorkout2Complete] = useState(false);

  const [waterOz, setWaterOz] = useState(0);

  const [bookTitle, setBookTitle] = useState('');
  const [pagesRead, setPagesRead] = useState(0);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [dietCompliant, setDietCompliant] = useState(false);
  const [zeroAlcohol, setZeroAlcohol] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const hydrationGoal = (settings?.hydrationGoal || 1) * 128;
  const readingGoal = settings?.readingGoal || 10;
  const waterComplete = waterOz >= hydrationGoal;
  const readingComplete = pagesRead >= readingGoal;

  const dayNumber = activeChallenge?.currentDay || dayLog?.dayNumber || 1;

  // Load existing log on mount
  useEffect(() => {
    if (activeChallenge?.id) {
      fetchTodayLog(activeChallenge.id).catch(() => {});
    }
  }, [activeChallenge?.id, fetchTodayLog]);

  // Pre-fill form from existing log
  useEffect(() => {
    if (!dayLog) return;
    if (dayLog.workout1Type) setWorkout1Type(dayLog.workout1Type);
    if (dayLog.workout1Duration) setWorkout1Duration(dayLog.workout1Duration);
    if (dayLog.workout1Notes) setWorkout1Notes(dayLog.workout1Notes);
    if (dayLog.workout1Complete) setWorkout1Complete(true);
    if (dayLog.workout2Type) setWorkout2Type(dayLog.workout2Type);
    if (dayLog.workout2Duration) setWorkout2Duration(dayLog.workout2Duration);
    if (dayLog.workout2Notes) setWorkout2Notes(dayLog.workout2Notes);
    if (dayLog.workout2Complete) setWorkout2Complete(true);
    if (dayLog.waterIntake) setWaterOz(dayLog.waterIntake);
    if (dayLog.bookTitle) setBookTitle(dayLog.bookTitle);
    if (dayLog.pagesRead) setPagesRead(dayLog.pagesRead);
    if (dayLog.dietCompliant) { setDietCompliant(true); setZeroAlcohol(true); }
    if (dayLog.progressPhotoUrl) setPhotoPreview(dayLog.progressPhotoUrl);
  }, [dayLog]);

  const handlePhotoChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  }, []);

  const addWater = useCallback((oz) => {
    setWaterOz((prev) => Math.min(prev + oz, 256));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!activeChallenge?.id) {
      setSubmitError('No active challenge found.');
      return;
    }

    const logData = {
      workout1Type,
      workout1Duration,
      workout1Notes,
      workout1Complete,
      workout2Type,
      workout2Duration,
      workout2Notes,
      workout2Complete,
      waterIntake: waterOz,
      waterComplete,
      bookTitle,
      pagesRead,
      readingComplete,
      dietCompliant: dietCompliant && zeroAlcohol,
      progressPhotoUrl: photoFile ? photoPreview : undefined,
    };

    try {
      await submitDayLog(activeChallenge.id, logData);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Submission failed.');
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Layout>
      <motion.form
        onSubmit={handleSubmit}
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto pb-24 lg:pb-8 space-y-5"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-6">
          <h1 className="font-display font-black text-primary text-3xl sm:text-4xl uppercase tracking-tight">
            Day {dayNumber} — Log
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">{today}</p>
        </motion.div>

        {/* Workout 1 */}
        <motion.div
          variants={fadeUp}
          className="glass-panel rounded-xl p-5 border border-outline/15 border-l-4 border-l-secondary"
        >
          <SectionLabel>workout 1</SectionLabel>
          <div className="flex flex-wrap gap-2 mb-4">
            {WORKOUT_TYPES.map((t) => (
              <PillButton key={t} active={workout1Type === t} onClick={() => setWorkout1Type(t)}>
                {t}
              </PillButton>
            ))}
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant text-sm">Duration</span>
            <Stepper value={workout1Duration} onChange={setWorkout1Duration} min={5} max={180} step={5} unit="min" />
          </div>
          <textarea
            value={workout1Notes}
            onChange={(e) => setWorkout1Notes(e.target.value)}
            placeholder="Notes..."
            rows={2}
            className="w-full bg-surface-higher border border-outline/30 rounded-lg px-4 py-3 text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:border-primary/50 transition-colors resize-none mb-4"
          />
          <button
            type="button"
            onClick={() => setWorkout1Complete((p) => !p)}
            className={`w-full py-3 rounded-lg font-display font-bold text-sm uppercase tracking-wider transition-all ${
              workout1Complete
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'bg-surface-higher text-on-surface-variant border border-outline/30 hover:border-primary/40'
            }`}
          >
            <span className="material-symbols-outlined text-base align-middle mr-2">
              {workout1Complete ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            {workout1Complete ? 'Complete' : 'Mark Complete'}
          </button>
        </motion.div>

        {/* Workout 2 */}
        <motion.div
          variants={fadeUp}
          className="glass-panel rounded-xl p-5 border border-outline/15 border-l-4 border-l-tertiary"
        >
          <SectionLabel>workout 2</SectionLabel>
          <div className="flex flex-wrap gap-2 mb-4">
            {WORKOUT_TYPES.map((t) => (
              <PillButton key={t} active={workout2Type === t} onClick={() => setWorkout2Type(t)}>
                {t}
              </PillButton>
            ))}
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant text-sm">Duration</span>
            <Stepper value={workout2Duration} onChange={setWorkout2Duration} min={5} max={180} step={5} unit="min" />
          </div>
          <textarea
            value={workout2Notes}
            onChange={(e) => setWorkout2Notes(e.target.value)}
            placeholder="Notes..."
            rows={2}
            className="w-full bg-surface-higher border border-outline/30 rounded-lg px-4 py-3 text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:border-primary/50 transition-colors resize-none mb-4"
          />
          <button
            type="button"
            onClick={() => setWorkout2Complete((p) => !p)}
            className={`w-full py-3 rounded-lg font-display font-bold text-sm uppercase tracking-wider transition-all ${
              workout2Complete
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'bg-surface-higher text-on-surface-variant border border-outline/30 hover:border-primary/40'
            }`}
          >
            <span className="material-symbols-outlined text-base align-middle mr-2">
              {workout2Complete ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            {workout2Complete ? 'Complete' : 'Mark Complete'}
          </button>
        </motion.div>

        {/* Hydration */}
        <motion.div
          variants={fadeUp}
          className="glass-panel rounded-xl p-5 border border-outline/15"
        >
          <SectionLabel>hydration</SectionLabel>
          <div className="flex items-center gap-4 mb-4">
            <span className="material-symbols-outlined text-tertiary text-4xl">water_drop</span>
            <div>
              <p className="font-display font-black text-2xl text-on-surface">
                {waterOz}
                <span className="text-on-surface-variant text-sm font-body font-normal ml-1">
                  / {hydrationGoal} oz
                </span>
              </p>
              {waterComplete && (
                <p className="text-primary-container text-xs font-semibold mt-0.5">Goal reached</p>
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-surface-higher rounded-full mb-4 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((waterOz / hydrationGoal) * 100, 100)}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
          <div className="flex gap-2">
            {[8, 16, 32].map((oz) => (
              <PillButton key={oz} active={false} onClick={() => addWater(oz)}>
                +{oz}oz
              </PillButton>
            ))}
          </div>
        </motion.div>

        {/* Reading / Intelligence */}
        <motion.div
          variants={fadeUp}
          className="glass-panel rounded-xl p-5 border border-outline/15"
        >
          <SectionLabel>intelligence</SectionLabel>
          <input
            type="text"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            placeholder="Book title"
            className="w-full bg-surface-higher border border-outline/30 rounded-lg px-4 py-3 text-on-surface text-sm font-body placeholder:text-outline focus:outline-none focus:border-primary/50 transition-colors mb-4"
          />
          <div className="flex items-center justify-between">
            <div>
              <span className="text-on-surface-variant text-sm">Pages read</span>
              {readingComplete && (
                <span className="text-primary-container text-xs font-semibold ml-2">Goal reached</span>
              )}
            </div>
            <Stepper value={pagesRead} onChange={setPagesRead} min={0} max={500} step={1} />
          </div>
        </motion.div>

        {/* Progress Photo / Capture */}
        <motion.div
          variants={fadeUp}
          className="glass-panel rounded-xl p-5 border border-outline/15"
        >
          <SectionLabel>capture</SectionLabel>
          <label className="block w-full border-2 border-dashed border-outline/40 rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Progress preview"
                className="w-full max-h-64 object-cover rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-4xl">
                  add_a_photo
                </span>
                <p className="text-on-surface-variant text-sm">Tap to add progress photo</p>
              </div>
            )}
          </label>
        </motion.div>

        {/* Diet Compliance / Discipline */}
        <motion.div
          variants={fadeUp}
          className="glass-panel rounded-xl p-5 border border-outline/15"
        >
          <SectionLabel>discipline</SectionLabel>
          <div className="space-y-3">
            <ToggleRow
              label="Diet Compliant"
              active={dietCompliant}
              onToggle={() => setDietCompliant((p) => !p)}
            />
            <ToggleRow
              label="Zero Alcohol"
              active={zeroAlcohol}
              onToggle={() => setZeroAlcohol((p) => !p)}
            />
          </div>
        </motion.div>

        {/* Error */}
        {submitError && (
          <motion.div variants={fadeUp} className="bg-error/10 border border-error/30 rounded-lg px-4 py-3">
            <p className="text-error text-sm">{submitError}</p>
          </motion.div>
        )}

        {/* Submit */}
        <motion.div variants={fadeUp} className="fixed bottom-20 left-4 right-4 lg:static lg:bottom-auto z-40 max-w-2xl mx-auto">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full performance-gradient text-bg font-display font-black text-sm uppercase tracking-widest rounded-xl py-4 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
          >
            {isLoading ? (
              <span className="material-symbols-outlined text-bg text-lg animate-spin">
                progress_activity
              </span>
            ) : submitted ? (
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-bg">check</span>
                Logged
              </span>
            ) : (
              'Submit Log'
            )}
          </button>
        </motion.div>
      </motion.form>
    </Layout>
  );
}

function ToggleRow({ label, active, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-lg transition-all ${
        active
          ? 'bg-primary/15 border border-primary/40'
          : 'bg-surface-higher border border-outline/30 hover:border-outline/50'
      }`}
    >
      <span className={`text-sm font-semibold uppercase tracking-wider ${active ? 'text-primary' : 'text-on-surface-variant'}`}>
        {label}
      </span>
      <div
        className={`w-12 h-7 rounded-full p-1 transition-colors ${
          active ? 'bg-primary' : 'bg-surface-highest'
        }`}
      >
        <motion.div
          className="w-5 h-5 rounded-full bg-bg shadow"
          animate={{ x: active ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}
