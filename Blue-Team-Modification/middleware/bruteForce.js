const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const BRUTE_FORCE_WINDOW_MS = toInt(process.env.BRUTE_FORCE_WINDOW_MS, 15 * 60 * 1000);
const BRUTE_FORCE_MAX_ATTEMPTS = toInt(process.env.BRUTE_FORCE_MAX_ATTEMPTS, 6);
const BRUTE_FORCE_BLOCK_MS = toInt(process.env.BRUTE_FORCE_BLOCK_MS, 30 * 60 * 1000);

const attempts = new Map();

const now = () => Date.now();

const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const getKey = (req, email) => `${getClientIp(req)}|${normalizeEmail(email)}`;

const getEntry = (key) => attempts.get(key) || null;

const cleanupKey = (key) => {
  const entry = getEntry(key);
  if (!entry) return;

  const currentTime = now();
  if (entry.blockedUntil && currentTime < entry.blockedUntil) return;

  if (currentTime - entry.firstAttemptAt > BRUTE_FORCE_WINDOW_MS) {
    attempts.delete(key);
    return;
  }

  if (!entry.blockedUntil && entry.failCount <= 0) {
    attempts.delete(key);
  }
};

const preLoginCheck = (req, res, next) => {
  const email = normalizeEmail(req.body?.email);
  if (!email) return next();

  const key = getKey(req, email);
  cleanupKey(key);
  const entry = getEntry(key);

  if (entry?.blockedUntil && now() < entry.blockedUntil) {
    const retryAfterSec = Math.ceil((entry.blockedUntil - now()) / 1000);
    res.set('Retry-After', String(retryAfterSec));
    return res.status(429).json({
      success: false,
      message: 'Compte temporairement verrouille suite a trop de tentatives. Reessayez plus tard.'
    });
  }

  return next();
};

const registerFailedLogin = (req, email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;

  const key = getKey(req, normalizedEmail);
  const currentTime = now();
  const existing = getEntry(key);

  let nextEntry;
  if (!existing || currentTime - existing.firstAttemptAt > BRUTE_FORCE_WINDOW_MS) {
    nextEntry = {
      failCount: 1,
      firstAttemptAt: currentTime,
      blockedUntil: null
    };
  } else {
    nextEntry = {
      failCount: existing.failCount + 1,
      firstAttemptAt: existing.firstAttemptAt,
      blockedUntil: existing.blockedUntil || null
    };
  }

  if (nextEntry.failCount >= BRUTE_FORCE_MAX_ATTEMPTS) {
    nextEntry.blockedUntil = currentTime + BRUTE_FORCE_BLOCK_MS;
  }

  attempts.set(key, nextEntry);
};

const registerSuccessfulLogin = (req, email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;
  attempts.delete(getKey(req, normalizedEmail));
};

module.exports = {
  preLoginCheck,
  registerFailedLogin,
  registerSuccessfulLogin
};