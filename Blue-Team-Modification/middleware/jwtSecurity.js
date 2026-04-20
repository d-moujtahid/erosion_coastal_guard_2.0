const crypto = require('crypto');

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const JWT_ALGORITHM = 'HS256';
const JWT_ISSUER = process.env.JWT_ISSUER || 'erosion-coastal-guard-api';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'erosion-coastal-guard-client';
const JWT_SECRET_MIN_LENGTH = toInt(process.env.JWT_SECRET_MIN_LENGTH, 32);

const JWT_INVALID_MAX_ATTEMPTS = toInt(process.env.JWT_INVALID_MAX_ATTEMPTS, 8);
const JWT_INVALID_WINDOW_MS = toInt(process.env.JWT_INVALID_WINDOW_MS, 10 * 60 * 1000);
const JWT_BLOCK_DURATION_MS = toInt(process.env.JWT_BLOCK_DURATION_MS, 15 * 60 * 1000);
const JWT_MAX_TOKEN_LENGTH = toInt(process.env.JWT_MAX_TOKEN_LENGTH, 4096);

const revokedJti = new Map();
const invalidJwtAttemptsByIp = new Map();

const weakSecrets = new Set([
  'changeme',
  'secret',
  'jwtsecret',
  'password',
  '123456',
  'local-dev-secret-change-me'
]);

const now = () => Date.now();

const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const cleanupRevokedTokens = () => {
  const currentTime = now();
  for (const [jti, expiresAtMs] of revokedJti.entries()) {
    if (expiresAtMs <= currentTime) revokedJti.delete(jti);
  }
};

const cleanupInvalidAttempts = (ip) => {
  const entry = invalidJwtAttemptsByIp.get(ip);
  if (!entry) return;

  const currentTime = now();
  if (entry.blockedUntil && currentTime < entry.blockedUntil) return;

  if (currentTime - entry.firstAttemptAt > JWT_INVALID_WINDOW_MS) {
    invalidJwtAttemptsByIp.delete(ip);
    return;
  }

  if (!entry.blockedUntil && entry.count <= 0) {
    invalidJwtAttemptsByIp.delete(ip);
  }
};

const recordInvalidJwtAttempt = (req) => {
  const ip = getClientIp(req);
  const currentTime = now();
  const current = invalidJwtAttemptsByIp.get(ip);

  let next;
  if (!current || currentTime - current.firstAttemptAt > JWT_INVALID_WINDOW_MS) {
    next = { count: 1, firstAttemptAt: currentTime, blockedUntil: null };
  } else {
    next = { count: current.count + 1, firstAttemptAt: current.firstAttemptAt, blockedUntil: current.blockedUntil || null };
  }

  if (next.count >= JWT_INVALID_MAX_ATTEMPTS) {
    next.blockedUntil = currentTime + JWT_BLOCK_DURATION_MS;
  }

  invalidJwtAttemptsByIp.set(ip, next);
};

const clearInvalidJwtAttempts = (req) => {
  invalidJwtAttemptsByIp.delete(getClientIp(req));
};

const isJwtSourceBlocked = (req) => {
  const ip = getClientIp(req);
  cleanupInvalidAttempts(ip);
  const entry = invalidJwtAttemptsByIp.get(ip);
  if (!entry?.blockedUntil) return false;
  return now() < entry.blockedUntil;
};

const getJwtBlockRetryAfterSec = (req) => {
  const ip = getClientIp(req);
  const entry = invalidJwtAttemptsByIp.get(ip);
  if (!entry?.blockedUntil) return 0;
  return Math.max(0, Math.ceil((entry.blockedUntil - now()) / 1000));
};

const validateJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || typeof secret !== 'string') {
    throw new Error('JWT_SECRET manquant. Definir une valeur forte en environnement.');
  }

  if (secret.length < JWT_SECRET_MIN_LENGTH) {
    throw new Error(`JWT_SECRET trop court (${secret.length}). Minimum requis: ${JWT_SECRET_MIN_LENGTH}.`);
  }

  if (weakSecrets.has(secret.toLowerCase())) {
    throw new Error('JWT_SECRET faible detecte. Utiliser une valeur aleatoire robuste.');
  }
};

const getJwtSignOptions = () => ({
  expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  algorithm: JWT_ALGORITHM,
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
  jwtid: crypto.randomUUID()
});

const getJwtVerifyOptions = () => ({
  algorithms: [JWT_ALGORITHM],
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
  maxAge: process.env.JWT_MAX_TOKEN_AGE || '8h'
});

const isTokenTooLarge = (token) => typeof token === 'string' && token.length > JWT_MAX_TOKEN_LENGTH;

const revokeToken = (decodedPayload) => {
  cleanupRevokedTokens();
  if (!decodedPayload?.jti || !decodedPayload?.exp) return;
  revokedJti.set(decodedPayload.jti, decodedPayload.exp * 1000);
};

const isTokenRevoked = (decodedPayload) => {
  cleanupRevokedTokens();
  if (!decodedPayload?.jti) return true;
  return revokedJti.has(decodedPayload.jti);
};

module.exports = {
  validateJwtSecret,
  getJwtSignOptions,
  getJwtVerifyOptions,
  isTokenTooLarge,
  isTokenRevoked,
  revokeToken,
  isJwtSourceBlocked,
  getJwtBlockRetryAfterSec,
  recordInvalidJwtAttempt,
  clearInvalidJwtAttempts,
  JWT_ALGORITHM
};