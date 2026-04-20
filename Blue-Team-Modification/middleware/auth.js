// middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();
const {
  validateJwtSecret,
  getJwtVerifyOptions,
  isTokenTooLarge,
  isTokenRevoked,
  isJwtSourceBlocked,
  getJwtBlockRetryAfterSec,
  recordInvalidJwtAttempt,
  clearInvalidJwtAttempts,
  JWT_ALGORITHM
} = require('./jwtSecurity');

validateJwtSecret();

const authenticate = (req, res, next) => {
  try {
    if (isJwtSourceBlocked(req)) {
      const retryAfterSec = getJwtBlockRetryAfterSec(req);
      if (retryAfterSec > 0) res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        message: 'Trop de tokens invalides detectes. Reessayez plus tard.'
      });
    }

    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      recordInvalidJwtAttempt(req);
      return res.status(401).json({ success: false, message: 'Token manquant.' });
    }

    const token = authHeader.split(' ')[1];

    if (!token || isTokenTooLarge(token)) {
      recordInvalidJwtAttempt(req);
      return res.status(401).json({ success: false, message: 'Token invalide.' });
    }

    const decodedUnsafe = jwt.decode(token, { complete: true });
    if (!decodedUnsafe || typeof decodedUnsafe !== 'object' || !decodedUnsafe.header || decodedUnsafe.header.alg !== JWT_ALGORITHM) {
      recordInvalidJwtAttempt(req);
      return res.status(401).json({ success: false, message: 'Token invalide.' });
    }

    req.user = jwt.verify(token, process.env.JWT_SECRET, getJwtVerifyOptions());

    if (isTokenRevoked(req.user)) {
      recordInvalidJwtAttempt(req);
      return res.status(401).json({ success: false, message: 'Token revoque.' });
    }

    clearInvalidJwtAttempts(req);
    next();
  } catch (err) {
    recordInvalidJwtAttempt(req);
    const msg = err.name === 'TokenExpiredError' ? 'Session expirée.' : 'Token invalide.';
    return res.status(401).json({ success: false, message: msg });
  }
};

module.exports = { authenticate };