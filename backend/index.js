/**
 * Superhero Generator - Backend Server
 * Express REST API for the iFAgent Intern Challenge
 *
 * Endpoints:
 *   POST /api/generate  - Generate superhero image via Gemini API
 *   GET  /api/logs      - Get all request logs
 *   DELETE /api/logs    - Clear logs
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const generateRouter = require('./routes/generate');
const logsRouter = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────

// CORS: allow Vite dev server, vercel deployments, and all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON with large body limit (for base64 images)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use('/api/generate', generateRouter);
app.use('/api/logs', logsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Superhero Generator API',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ─── Start Server / Export for Vercel ─────────────────────────────────────────

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🦸 Superhero Generator API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Gemini Key: ${process.env.GEMINI_API_KEY ? '✅ Loaded' : '❌ MISSING'}\n`);
  });
}

module.exports = app;
