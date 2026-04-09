const express = require('express');
const { authenticate } = require('../middleware/auth');
const prisma = require('../services/db');

const router = express.Router({ mergeParams: true });

router.use(authenticate);

// Helper: get today's date as a Date object (UTC midnight, date-only)
function getTodayDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

// Helper: verify challenge belongs to user
async function getChallenge(challengeId, userId) {
  return prisma.challenge.findFirst({
    where: { id: challengeId, userId },
  });
}

// GET /challenges/:challengeId/log/today
router.get('/today', async (req, res, next) => {
  try {
    const challenge = await getChallenge(req.params.challengeId, req.user.id);
    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    const today = getTodayDate();
    const log = await prisma.dayLog.findUnique({
      where: {
        challengeId_date: { challengeId: challenge.id, date: today },
      },
    });

    res.json({ success: true, data: log || null });
  } catch (err) {
    next(err);
  }
});

// POST /challenges/:challengeId/log/today
router.post('/today', async (req, res, next) => {
  try {
    const challenge = await getChallenge(req.params.challengeId, req.user.id);
    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    if (challenge.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Challenge is not active' });
    }

    const today = getTodayDate();

    const {
      workout1Complete,
      workout1Type,
      workout1Duration,
      workout1Notes,
      workout2Complete,
      workout2Type,
      workout2Duration,
      workout2Notes,
      waterIntake,
      waterComplete,
      pagesRead,
      readingComplete,
      bookTitle,
      dietCompliant,
      progressPhotoUrl,
    } = req.body;

    // Calculate allTasksComplete
    const allTasksComplete =
      !!workout1Complete &&
      !!workout2Complete &&
      !!waterComplete &&
      !!readingComplete &&
      !!dietCompliant;

    // Check if a log already exists for today
    const existingLog = await prisma.dayLog.findUnique({
      where: {
        challengeId_date: { challengeId: challenge.id, date: today },
      },
    });

    const wasAlreadyComplete = existingLog ? existingLog.allTasksComplete : false;

    const logData = {
      workout1Complete: !!workout1Complete,
      workout1Type: workout1Type || null,
      workout1Duration: workout1Duration != null ? parseInt(workout1Duration, 10) : null,
      workout1Notes: workout1Notes || null,
      workout2Complete: !!workout2Complete,
      workout2Type: workout2Type || null,
      workout2Duration: workout2Duration != null ? parseInt(workout2Duration, 10) : null,
      workout2Notes: workout2Notes || null,
      waterIntake: waterIntake != null ? parseFloat(waterIntake) : 0,
      waterComplete: !!waterComplete,
      pagesRead: pagesRead != null ? parseInt(pagesRead, 10) : 0,
      readingComplete: !!readingComplete,
      bookTitle: bookTitle || null,
      dietCompliant: !!dietCompliant,
      progressPhotoUrl: progressPhotoUrl || null,
      allTasksComplete,
    };

    const log = await prisma.dayLog.upsert({
      where: {
        challengeId_date: { challengeId: challenge.id, date: today },
      },
      create: {
        challengeId: challenge.id,
        userId: req.user.id,
        dayNumber: challenge.currentDay,
        date: today,
        ...logData,
      },
      update: logData,
    });

    // If newly completed (wasn't complete before, now is), update challenge
    if (allTasksComplete && !wasAlreadyComplete) {
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId: req.user.id },
      });
      const targetDays = userSettings?.challengeDays || 75;
      const newCompletedDays = challenge.completedDays + 1;
      const newCurrentDay = challenge.currentDay + 1;
      const newStatus = newCompletedDays >= targetDays ? 'completed' : 'active';

      await prisma.challenge.update({
        where: { id: challenge.id },
        data: {
          completedDays: newCompletedDays,
          currentDay: newStatus === 'completed' ? challenge.currentDay : newCurrentDay,
          status: newStatus,
        },
      });
    }

    // If was complete but now unchecked, decrement
    if (!allTasksComplete && wasAlreadyComplete) {
      await prisma.challenge.update({
        where: { id: challenge.id },
        data: {
          completedDays: Math.max(0, challenge.completedDays - 1),
          currentDay: Math.max(1, challenge.currentDay - 1),
        },
      });
    }

    res.json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
});

// GET /challenges/:challengeId/log/history
router.get('/history', async (req, res, next) => {
  try {
    const challenge = await getChallenge(req.params.challengeId, req.user.id);
    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    const logs = await prisma.dayLog.findMany({
      where: { challengeId: challenge.id },
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
