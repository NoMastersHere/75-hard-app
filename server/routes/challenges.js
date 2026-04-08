const express = require('express');
const { authenticate } = require('../middleware/auth');
const prisma = require('../services/db');

const router = express.Router();

router.use(authenticate);

// GET /challenges - list user's challenges
router.get('/', async (req, res, next) => {
  try {
    const challenges = await prisma.challenge.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: challenges });
  } catch (err) {
    next(err);
  }
});

// POST /challenges - create new challenge
router.post('/', async (req, res, next) => {
  try {
    const { startDate } = req.body;

    // Only one active challenge allowed
    const active = await prisma.challenge.findFirst({
      where: { userId: req.user.id, status: 'active' },
    });
    if (active) {
      return res.status(409).json({
        success: false,
        error: 'You already have an active challenge. Complete or delete it first.',
      });
    }

    const challenge = await prisma.challenge.create({
      data: {
        userId: req.user.id,
        startDate: startDate ? new Date(startDate) : new Date(),
        currentDay: 1,
        status: 'active',
        completedDays: 0,
      },
    });

    res.status(201).json({ success: true, data: challenge });
  } catch (err) {
    next(err);
  }
});

// GET /challenges/:id - get challenge with all day logs
router.get('/:id', async (req, res, next) => {
  try {
    const challenge = await prisma.challenge.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        dayLogs: { orderBy: { date: 'asc' } },
      },
    });
    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    res.json({ success: true, data: challenge });
  } catch (err) {
    next(err);
  }
});

// DELETE /challenges/:id - delete challenge (cascade deletes logs)
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.challenge.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    await prisma.challenge.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

// POST /challenges/:id/reset - reset challenge and start new one
router.post('/:id/reset', async (req, res, next) => {
  try {
    const existing = await prisma.challenge.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    // Mark old challenge as failed
    await prisma.challenge.update({
      where: { id: req.params.id },
      data: { currentDay: 0, status: 'failed' },
    });

    // Create new active challenge starting today
    const newChallenge = await prisma.challenge.create({
      data: {
        userId: req.user.id,
        startDate: new Date(),
        currentDay: 1,
        status: 'active',
        completedDays: 0,
      },
    });

    res.json({ success: true, data: newChallenge });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
