import { safeEqual } from './auth.ts';
export async function validWebhookSignature(
  raw: string,
  secret: string,
  signature: string,
) {
  if (!/^[a-f0-9]{128}$/.test(signature)) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  );
  const hash = Array.from(
    new Uint8Array(
      await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw)),
    ),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
  return safeEqual(hash, signature);
}
export function paymentMatches(
  record: { reference: string; amount: number; institution_id: string },
  transaction: {
    status?: string;
    reference?: string;
    currency?: string;
    amount?: number;
    metadata?: { institution_id?: unknown };
  },
) {
  return (
    transaction.status === 'success' &&
    transaction.reference === record.reference &&
    transaction.currency === 'GHS' &&
    transaction.amount === record.amount &&
    transaction.metadata?.institution_id === record.institution_id
  );
}
export function coursePaymentMatches(
  record: { reference: string; amount: number; course_id: string; user_id: string },
  transaction: {
    status?: string;
    reference?: string;
    currency?: string;
    amount?: number;
    metadata?: { course_id?: unknown; user_id?: unknown };
  },
) {
  return (
    transaction.status === 'success' &&
    transaction.reference === record.reference &&
    transaction.currency === 'GHS' &&
    transaction.amount === record.amount &&
    transaction.metadata?.course_id === record.course_id &&
    transaction.metadata?.user_id === record.user_id
  );
}
