export async function digest(value: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
    ),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
}
const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
export function token() {
  return hex(crypto.getRandomValues(new Uint8Array(32)));
}
export async function hashPassword(password: string, salt = token()) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const result = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: new TextEncoder().encode(salt),
      iterations: 100000,
    },
    key,
    256,
  );
  return `pbkdf2:100000:${salt}:${hex(new Uint8Array(result))}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const computed = await hashPassword(password, encoded.split(':')[2]);
  return safeEqual(computed, encoded);
}
export function safeEqual(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
export function passwordValid(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 12 && value.length <= 128;
}
