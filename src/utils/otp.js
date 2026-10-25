import crypto from 'node:crypto';

/** ساخت کد ۶ رقمی با منبع تصادفی امن */
export function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

/** هش SHA-256 کد — چون کد تصادفی ۶ رقمی است، هش سریع کافی و امن است */
export function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

/** مقایسه امن (timing-safe) کد با هش ذخیره‌شده */
export function verifyOtpHash(code, storedHash) {
  const hash = hashOtp(code);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(String(storedHash), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
