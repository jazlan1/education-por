// Professional logging utility
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const getLogFileName = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.log`;
};

const formatLog = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const log = {
    timestamp,
    level,
    message,
    ...data,
  };
  return JSON.stringify(log);
};

const writeLog = (level, message, data = {}) => {
  const logFile = path.join(logsDir, getLogFileName());
  const logEntry = formatLog(level, message, data) + '\n';
  
  fs.appendFileSync(logFile, logEntry);
  
  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${level}] ${message}`, data);
  }
};

const logger = {
  info: (message, data) => writeLog('INFO', message, data),
  warn: (message, data) => writeLog('WARN', message, data),
  error: (message, data) => writeLog('ERROR', message, data),
  debug: (message, data) => writeLog('DEBUG', message, data),
};

module.exports = logger;
