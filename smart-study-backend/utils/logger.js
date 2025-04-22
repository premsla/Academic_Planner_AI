/**
 * Simple logger utility
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file paths
const errorLogPath = path.join(logsDir, 'error.log');
const infoLogPath = path.join(logsDir, 'info.log');

/**
 * Format a log message with timestamp
 * @param {string} level - Log level (e.g., 'ERROR', 'INFO')
 * @param {string} message - Log message
 * @returns {string} - Formatted log message
 */
const formatLogMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}\n`;
};

/**
 * Write a message to a log file
 * @param {string} filePath - Path to the log file
 * @param {string} message - Message to log
 */
const writeToLog = (filePath, message) => {
  fs.appendFile(filePath, message, (err) => {
    if (err) {
      console.error(`Failed to write to log file: ${err.message}`);
    }
  });
};

/**
 * Log an error message
 * @param {string} message - Error message
 */
const error = (message) => {
  const formattedMessage = formatLogMessage('ERROR', message);
  console.error(formattedMessage.trim());
  writeToLog(errorLogPath, formattedMessage);
};

/**
 * Log an info message
 * @param {string} message - Info message
 */
const info = (message) => {
  const formattedMessage = formatLogMessage('INFO', message);
  console.log(formattedMessage.trim());
  writeToLog(infoLogPath, formattedMessage);
};

/**
 * Log a warning message
 * @param {string} message - Warning message
 */
const warn = (message) => {
  const formattedMessage = formatLogMessage('WARN', message);
  console.warn(formattedMessage.trim());
  writeToLog(errorLogPath, formattedMessage);
};

/**
 * Log a debug message (only in development)
 * @param {string} message - Debug message
 */
const debug = (message) => {
  if (process.env.NODE_ENV === 'development') {
    const formattedMessage = formatLogMessage('DEBUG', message);
    console.debug(formattedMessage.trim());
  }
};

module.exports = {
  error,
  info,
  warn,
  debug
};
