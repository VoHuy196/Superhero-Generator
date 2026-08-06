/**
 * Logger utility - In-memory log store
 * Stores all API request/response logs for the Log Viewer UI
 */

const { v4: uuidv4 } = require('uuid');

// In-memory log array (resets on server restart)
let logs = [];

/**
 * Add a new log entry
 * @param {Object} entry - Log data
 * @param {string} entry.prompt - Prompt sent to API
 * @param {number} entry.httpStatus - HTTP status code from API response
 * @param {number} entry.latency - Time taken in milliseconds
 * @param {string|null} entry.error - Error message if any
 * @param {Object} entry.config - API config parameters used
 * @returns {Object} The created log entry
 */
function addLog({ prompt, httpStatus, latency, error = null, config = {} }) {
  const entry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    prompt,
    httpStatus,
    latency,
    error,
    config,
  };
  logs.unshift(entry); // newest first

  // Keep max 100 logs in memory
  if (logs.length > 100) {
    logs = logs.slice(0, 100);
  }

  console.log(`[LOG] ${entry.timestamp} | Status: ${httpStatus} | Latency: ${latency}ms${error ? ` | Error: ${error}` : ''}`);
  return entry;
}

/**
 * Get all logs (newest first)
 * @returns {Array} Array of log entries
 */
function getLogs() {
  return logs;
}

/**
 * Clear all logs
 */
function clearLogs() {
  logs = [];
}

module.exports = { addLog, getLogs, clearLogs };
