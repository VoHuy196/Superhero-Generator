/**
 * Logs route - Returns all stored API logs
 * GET  /api/logs        - Get all logs
 * DELETE /api/logs      - Clear all logs
 */

const express = require('express');
const router = express.Router();
const { getLogs, clearLogs } = require('../utils/logger');

/**
 * GET /api/logs
 * Returns all log entries (newest first)
 */
router.get('/', (req, res) => {
  const logs = getLogs();
  return res.json({ success: true, logs });
});

/**
 * DELETE /api/logs
 * Clears all log entries
 */
router.delete('/', (req, res) => {
  clearLogs();
  return res.json({ success: true, message: 'Logs cleared' });
});

module.exports = router;
