require('dotenv').config();

module.exports = {
  VIRUSTOTAL_API_KEY: process.env.VIRUSTOTAL_API_KEY,
  SCAN_LIMIT_PER_MINUTE: 3,
  POLL_INTERVAL_MS: 50000,
  MAX_POLL_ATTEMPTS: 3
};
