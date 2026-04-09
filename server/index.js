if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

console.log('JWT_SECRET defined:', !!process.env.JWT_SECRET);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL defined:', !!process.env.DATABASE_URL);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'https://75hard.lanirose.com',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check (before routes so it always works)
app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

// Routes — wrapped in try/catch so failures are logged, not silent
const routeModules = [
  { path: '/auth', module: './routes/auth' },
  { path: '/challenges', module: './routes/challenges' },
  { path: '/challenges/:challengeId/log', module: './routes/logs' },
  { path: '/settings', module: './routes/settings' },
];

for (const route of routeModules) {
  try {
    const router = require(route.module);
    app.use(route.path, router);
    console.log(`Route loaded: ${route.path}`);
  } catch (err) {
    console.error(`FAILED to load route ${route.path} (${route.module}):`, err.message);
    console.error(err.stack);
  }
}

// Serve client build in production
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
