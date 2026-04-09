import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import useChallengeStore from '../store/challengeStore';
import api from '../api/client';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getLogMap(logs) {
  const map = {};
  (logs || []).forEach((log) => {
    const key = log.date?.slice(0, 10);
    if (key) map[key] = log;
  });
  return map;
}

function getDaysBetween(start, count) {
  const days = [];
  const d = new Date(start);
  for (let i = 0; i < count; i++) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function isAllComplete(log) {
  if (!log) return false;
  return (
    log.workout1Complete &&
    log.workout2Complete &&
    log.waterComplete &&
    log.readingComplete &&
    log.dietCompliant &&
    log.dietCompliant
  );
}

function isPartialComplete(log) {
  if (!log) return false;
  return (
    log.workout1Complete ||
    log.workout2Complete ||
    log.waterComplete ||
    log.readingComplete ||
    log.dietCompliant ||
    log.dietCompliant
  );
}

export default function TrendsPage() {
  const { challenge, challenges, fetchChallenges, isLoading } = useChallengeStore();
  const [logs, setLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [books, setBooks] = useState([]);

  const activeChallenge = challenge || challenges?.find((c) => c.status === 'active');

  useEffect(() => {
    fetchChallenges().catch(() => {});
  }, [fetchChallenges]);

  useEffect(() => {
    if (activeChallenge?.id) {
      api.get(`/challenges/${activeChallenge.id}/log/history`).then(({ data }) => {
        const fetched = data.data || [];
        setLogs(fetched);
        setAllLogs(fetched);
      }).catch(() => {});

      api.get(`/challenges/${activeChallenge.id}/log/books`).then(({ data }) => {
        setBooks(data.data?.books || []);
      }).catch(() => {});
    }
  }, [activeChallenge?.id]);

  const logMap = useMemo(() => getLogMap(logs), [logs]);

  const totalDays = 75;
  const startDate = activeChallenge?.startDate
    ? new Date(activeChallenge.startDate)
    : new Date();

  const calendarDays = useMemo(
    () => getDaysBetween(startDate, totalDays),
    [startDate, totalDays]
  );

  const todayStr = new Date().toISOString().slice(0, 10);

  // Stats
  const completedDays = allLogs.filter((l) => isAllComplete(l)).length;
  const totalWorkouts = allLogs.reduce(
    (sum, l) => sum + (l.workout1Complete ? 1 : 0) + (l.workout2Complete ? 1 : 0),
    0
  );
  const totalPages = allLogs.reduce((sum, l) => sum + (l.pagesRead || 0), 0);
  const totalWaterCups = allLogs.reduce((sum, l) => sum + (l.waterIntake || 0), 0);
  const completionRate =
    allLogs.length > 0 ? Math.round((completedDays / allLogs.length) * 100) : 0;

  // Streaks
  const { currentStreak, bestStreak } = useMemo(() => {
    let current = 0;
    let best = 0;
    let streak = 0;
    const sorted = [...allLogs].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    for (const log of sorted) {
      if (isAllComplete(log)) {
        streak++;
        best = Math.max(best, streak);
      } else {
        streak = 0;
      }
    }
    current = streak;
    return { currentStreak: current, bestStreak: best };
  }, [allLogs]);

  // Weekly performance (last 7 days)
  const weeklyData = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const log = logMap[key];
      let completed = 0;
      let total = 5;
      if (log) {
        if (log.workout1Complete) completed++;
        if (log.workout2Complete) completed++;
        if (log.waterComplete) completed++;
        if (log.readingComplete) completed++;
        if (log.dietCompliant) completed++;
      }
      result.push({
        day: DAY_LABELS[d.getDay()],
        pct: log ? Math.round((completed / total) * 100) : 0,
        date: key,
      });
    }
    return result;
  }, [logMap]);

  // Photos
  const photos = useMemo(
    () =>
      allLogs
        .filter((l) => l.progressPhotoUrl)
        .map((l) => ({ url: l.progressPhotoUrl, day: l.dayNumber || '?' })),
    [allLogs]
  );

  // Month markers for heatmap
  const monthMarkers = useMemo(() => {
    const markers = [];
    let lastMonth = -1;
    calendarDays.forEach((d, i) => {
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        markers.push({ index: i, label: MONTH_LABELS[lastMonth] });
      }
    });
    return markers;
  }, [calendarDays]);

  return (
    <Layout>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-3xl mx-auto pb-24 lg:pb-8 space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeUp}>
          <h1 className="font-display font-black text-primary text-3xl sm:text-4xl uppercase tracking-tight">
            Evolution
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">Performance analytics</p>
        </motion.div>

        {/* Streak Counter */}
        <motion.div variants={fadeUp} className="flex gap-4">
          <div className="glass-panel rounded-xl p-6 border border-outline/15 flex-1 text-center">
            <p className="font-display font-black text-5xl text-primary-container leading-none">
              {currentStreak}
            </p>
            <p className="label-text text-on-surface-variant mt-2">current streak</p>
          </div>
          <div className="glass-panel rounded-xl p-6 border border-outline/15 flex-1 text-center">
            <p className="font-display font-black text-5xl text-on-surface leading-none">
              {bestStreak}
            </p>
            <p className="label-text text-on-surface-variant mt-2">best streak</p>
          </div>
        </motion.div>

        {/* Consistency Heatmap */}
        <motion.div variants={fadeUp} className="glass-panel rounded-xl p-5 border border-outline/15">
          <p className="label-text text-on-surface-variant mb-4">consistency map</p>

          {/* Month labels */}
          <div className="flex gap-0 mb-1 ml-0 text-[9px] text-on-surface-variant uppercase tracking-wider">
            {monthMarkers.map((m) => (
              <span
                key={m.index}
                style={{ marginLeft: m.index === 0 ? 0 : undefined, position: 'relative' }}
                className="mr-auto first:ml-0"
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex flex-wrap gap-[3px]">
            {calendarDays.map((d, i) => {
              const key = d.toISOString().slice(0, 10);
              const log = logMap[key];
              const isToday = key === todayStr;
              const isFuture = d > new Date();
              let bg = 'bg-surface-higher';
              if (!isFuture && isAllComplete(log)) bg = 'bg-primary-container';
              else if (!isFuture && isPartialComplete(log)) bg = 'bg-secondary';
              else if (isFuture) bg = 'bg-surface';

              return (
                <div
                  key={i}
                  className={`w-[10px] h-[10px] rounded-[2px] ${bg} transition-colors ${
                    isToday ? 'ring-1 ring-primary ring-offset-1 ring-offset-bg' : ''
                  }`}
                  title={`Day ${i + 1} - ${key}`}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-[10px] h-[10px] rounded-[2px] bg-primary-container" />
              <span className="text-[10px] text-on-surface-variant">Complete</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-[10px] h-[10px] rounded-[2px] bg-secondary" />
              <span className="text-[10px] text-on-surface-variant">Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-[10px] h-[10px] rounded-[2px] bg-surface-higher" />
              <span className="text-[10px] text-on-surface-variant">Missed</span>
            </div>
          </div>
        </motion.div>

        {/* Weekly Performance */}
        <motion.div variants={fadeUp} className="glass-panel rounded-xl p-5 border border-outline/15">
          <p className="label-text text-on-surface-variant mb-4">weekly performance</p>
          <div className="flex items-end justify-between gap-2 h-32">
            {weeklyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-on-surface-variant font-semibold">
                  {d.pct > 0 ? `${d.pct}%` : ''}
                </span>
                <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                  <motion.div
                    className="w-full max-w-[28px] rounded-t-md"
                    style={{
                      background:
                        d.pct > 0
                          ? 'linear-gradient(180deg, #d1fc00 0%, #3e4c00 100%)'
                          : '#201f1f',
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(d.pct * 0.8, 4)}px` }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                  />
                </div>
                <span className="text-[10px] text-on-surface-variant">{d.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Photo Timeline */}
        <motion.div variants={fadeUp} className="glass-panel rounded-xl p-5 border border-outline/15">
          <p className="label-text text-on-surface-variant mb-4">transformation</p>
          {photos.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {photos.map((p, i) => (
                <div key={i} className="shrink-0 group relative">
                  <img
                    src={p.url}
                    alt={`Day ${p.day}`}
                    className="w-20 h-28 object-cover rounded-lg grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                  <span className="absolute bottom-1 left-1 bg-bg/80 text-primary text-[10px] font-display font-bold px-1.5 py-0.5 rounded">
                    D{p.day}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl mb-2">photo_camera</span>
              <p className="text-sm">No progress photos yet</p>
            </div>
          )}
        </motion.div>

        {/* Intelligence — Reading Log */}
        <motion.div variants={fadeUp} className="glass-panel rounded-xl p-5 border border-outline/15">
          <p className="label-text text-on-surface-variant mb-4">intelligence</p>

          {books.length > 0 ? (
            <div className="space-y-3">
              {books.map((book, i) => {
                const avgPages = book.sessions > 0 ? Math.round(book.totalPages / book.sessions) : 0;
                return (
                  <div
                    key={i}
                    className="bg-surface-higher rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-on-surface text-sm font-semibold truncate">
                          {book.title}
                        </p>
                        <p className="text-on-surface-variant text-xs mt-1">
                          {book.sessions} {book.sessions === 1 ? 'session' : 'sessions'} &middot; ~{avgPages} pg/session
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display font-black text-xl text-primary-container leading-none">
                          {book.totalPages}
                        </p>
                        <p className="text-on-surface-variant text-[10px] uppercase tracking-wider mt-1">pages</p>
                      </div>
                    </div>

                    {/* Mini progress bar */}
                    <div className="mt-3 h-[3px] bg-surface-highest rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #f4ffc6, #d1fc00)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((book.totalPages / Math.max(...books.map(b => b.totalPages))) * 100, 100)}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between pt-2 border-t border-outline/15">
                <span className="text-on-surface-variant text-xs uppercase tracking-wider">Total across all books</span>
                <span className="font-display font-bold text-primary text-sm">
                  {books.reduce((sum, b) => sum + b.totalPages, 0)} pages
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl mb-2">menu_book</span>
              <p className="text-sm">No books logged yet</p>
              <p className="text-xs mt-1">Add a book title when logging your daily reading</p>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          <StatCard label="workouts" value={totalWorkouts} icon="fitness_center" color="#ff734a" />
          <StatCard label="pages read" value={totalPages} icon="menu_book" color="#f4ffc6" />
          <StatCard label="water (cups)" value={totalWaterCups} icon="water_drop" color="#81ecff" />
          <StatCard label="completion" value={`${completionRate}%`} icon="verified" color="#d1fc00" />
        </motion.div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <span className="material-symbols-outlined text-primary text-3xl animate-spin">
              progress_activity
            </span>
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
