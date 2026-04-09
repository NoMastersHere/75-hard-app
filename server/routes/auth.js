const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const { authenticate } = require('../middleware/auth');
const prisma = require('../services/db');

const resend = new Resend(process.env.RESEND_API_KEY);

const router = express.Router();

function generateTokens(user) {
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { sub: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        settings: {
          create: {},
        },
      },
      include: { settings: true },
    });

    const tokens = generateTokens(user);
    res.status(201).json({
      success: true,
      data: { user: sanitizeUser(user), ...tokens },
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const tokens = generateTokens(user);
    res.json({
      success: true,
      data: { user: sanitizeUser(user), ...tokens },
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token required' });
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const tokens = generateTokens(user);
    res.json({ success: true, data: tokens });
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
});

// GET /auth/me (protected)
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { settings: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, data: { message: 'If that email exists, a reset link has been sent.' } });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });

    const clientUrl = process.env.CLIENT_URL || 'https://75hard.lanirose.com';
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;

    try {
      await resend.emails.send({
        from: '75 Hard <noreply@nomasters.biz>',
        to: email,
        subject: 'Reset your 75 Hard password',
        html: `
          <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 480px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; overflow: hidden;">
            <div style="padding: 40px 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 8px;">75 HARD</h1>
              <p style="color: #888888; font-size: 13px; margin: 0; letter-spacing: 2px;">STAY THE COURSE</p>
            </div>
            <div style="padding: 0 32px 40px;">
              <p style="color: #cccccc; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                You requested a password reset. Click the button below to choose a new password. This link expires in 1 hour.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: #ffffff; color: #1a1a1a; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                  Reset Password
                </a>
              </div>
              <p style="color: #666666; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
                If you didn't request this, you can safely ignore this email. Your password won't change.
              </p>
            </div>
            <div style="padding: 20px 32px; border-top: 1px solid #2a2a2a; text-align: center;">
              <p style="color: #555555; font-size: 12px; margin: 0;">75 Hard Tracker &mdash; No Masters</p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('[PASSWORD RESET] Failed to send email:', emailErr.message);
    }

    res.json({ success: true, data: { message: 'If that email exists, a reset link has been sent.' } });
  } catch (err) {
    next(err);
  }
});

// POST /auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, error: 'Token and new password required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    res.json({ success: true, data: { message: 'Password reset successful' } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
