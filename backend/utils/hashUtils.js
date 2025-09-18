// utils/hashUtils.js
const crypto = require('crypto');

// Hash function 
function hashClaimCode(claimCode) {
  return crypto.createHash('sha256').update(claimCode).digest('hex');
}

module.exports = { hashClaimCode };