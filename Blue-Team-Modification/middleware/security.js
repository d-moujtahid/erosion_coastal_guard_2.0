const helmet = require('helmet');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const SECURITY_MAX_BODY_KB = toInt(process.env.SECURITY_MAX_BODY_KB, 256);

const globalRateLimiter = rateLimit({
  windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  max: toInt(process.env.RATE_LIMIT_MAX_REQUESTS, 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de requetes depuis cette IP. Reessayez plus tard.'
  }
});

const authRateLimiter = rateLimit({
  windowMs: toInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000),
  max: toInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Reessayez plus tard.'
  }
});

const requestSlowDown = slowDown({
  windowMs: toInt(process.env.SLOW_DOWN_WINDOW_MS, 15 * 60 * 1000),
  delayAfter: toInt(process.env.SLOW_DOWN_AFTER, 120),
  delayMs: () => toInt(process.env.SLOW_DOWN_DELAY_MS, 250)
});

const suspiciousSqlPattern = /('|--|\/\*|\*\/|;\s*(drop|truncate|delete|update|insert|alter|create)\b|\bunion\b\s+\bselect\b|\bselect\b.+\bfrom\b|\bor\b\s+\d+\s*=\s*\d+|\band\b\s+\d+\s*=\s*\d+|\binformation_schema\b|\bsleep\s*\(|\bbenchmark\s*\()/i;

const hasSuspiciousSql = (value) => {
  if (value == null) return false;

  if (Array.isArray(value)) {
    return value.some((item) => hasSuspiciousSql(item));
  }

  if (typeof value === 'object') {
    return Object.values(value).some((item) => hasSuspiciousSql(item));
  }

  if (typeof value === 'string') {
    return suspiciousSqlPattern.test(value);
  }

  return false;
};

const sqlInjectionGuard = (req, res, next) => {
  if (hasSuspiciousSql(req.query) || hasSuspiciousSql(req.params) || hasSuspiciousSql(req.body)) {
    return res.status(403).json({
      success: false,
      message: 'Requete bloquee par la protection SQL injection.'
    });
  }
  return next();
};

const securityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
});

module.exports = {
  SECURITY_MAX_BODY_KB,
  securityHeaders,
  hppProtection: hpp(),
  globalRateLimiter,
  authRateLimiter,
  requestSlowDown,
  sqlInjectionGuard
};