const express = require('express');
const { authenticate } = require('../middleware/auth');
const prisma = require('../services/db');

const router = express.Router();

router.use(authenticate);

// GET /settings - return user's settings
router.get('/', async (req, res, next) => {
  try {
    let settings = await prisma.userSettings.findUnique({
      where: { userId: req.user.id },
    });

    // Auto-create default settings if none exist
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: req.user.id },
      });
    }

    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

// PUT /settings - update user's settings
router.put('/', async (req, res, next) => {
  try {
    const {
      challengeDays,
      workoutDuration,
      hydrationGoal,
      readingGoal,
      dietConstraint,
      reminderTasks,
      reminderHydration,
      reminderPhoto,
    } = req.body;

    const data = {};
    if (challengeDays !== undefined) data.challengeDays = Math.min(365, Math.max(1, parseInt(challengeDays, 10)));
    if (workoutDuration !== undefined) data.workoutDuration = parseInt(workoutDuration, 10);
    if (hydrationGoal !== undefined) data.hydrationGoal = parseFloat(hydrationGoal);
    if (readingGoal !== undefined) data.readingGoal = parseInt(readingGoal, 10);
    if (dietConstraint !== undefined) data.dietConstraint = dietConstraint || null;
    if (reminderTasks !== undefined) data.reminderTasks = !!reminderTasks;
    if (reminderHydration !== undefined) data.reminderHydration = !!reminderHydration;
    if (reminderPhoto !== undefined) data.reminderPhoto = !!reminderPhoto;

    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, ...data },
      update: data,
    });

    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
