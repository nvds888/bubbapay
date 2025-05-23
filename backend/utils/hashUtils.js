// utils/hashUtils.js
const crypto = require('crypto');

// Hash function that can be used consistently across the application
function hashClaimCode(claimCode) {
  return crypto.createHash('sha256').update(claimCode).digest('hex');
}

module.exports = { hashClaimCode };