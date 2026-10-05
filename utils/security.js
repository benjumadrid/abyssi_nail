import crypto from 'crypto';

/**
 * Cryptographically hashes a password using scrypt with a unique random 16-byte salt.
 */
export function hashPassword(password) {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password.trim(), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Safely verifies a candidate password against the stored password hash.
 * Also supports legacy plain text passwords gracefully and transparently.
 */
export function verifyPassword(password, stored) {
  if (!password || !stored) return false;

  // Graceful migration support for legacy plain text passwords
  if (!stored.includes(':')) {
    return password.trim() === stored.trim();
  }

  try {
    const [salt, key] = stored.split(':');
    if (!salt || !key) return false;

    const keyBuf = Buffer.from(key, 'hex');
    const derived = crypto.scryptSync(password.trim(), salt, 64);
    return crypto.timingSafeEqual(keyBuf, derived);
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}
