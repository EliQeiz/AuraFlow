import test from 'node:test';
import assert from 'node:assert/strict';
import {
  grade,
  publicQuestions,
  shuffleQuestions,
  validateQuestions,
} from '../lib/assessment.ts';
import {
  hashPassword,
  verifyPassword,
  passwordValid,
  safeEqual,
  digest,
} from '../lib/auth.ts';
import {
  validWebhookSignature,
  paymentMatches,
  coursePaymentMatches,
} from '../lib/payment.ts';
import { integrityRisk, isIntegrityEventType } from '../lib/integrity.ts';
import { createHmac } from 'node:crypto';
const questions = [
  { id: 'a', prompt: '2 + 2?', options: ['3', '4', '5', '6'], correct: 1 },
  { id: 'b', prompt: '3 + 3?', options: ['6', '7', '8', '9'], correct: 0 },
];
test('scores only answers belonging to the server question snapshot', () => {
  assert.equal(grade(questions, { a: 1, b: 0, forged: 100 }), 100);
  assert.equal(grade(questions, { a: 1 }), 50);
  assert.equal(grade(questions, {}), 0);
  assert.equal(grade(questions, { a: 99, b: -1 }), 0);
  assert.throws(() => grade([], {}));
});
test('student questions never contain the answer key', () => {
  const result = publicQuestions(questions);
  assert.ok(result.every((q) => !('correct' in q)));
  assert.deepEqual(result[0].options, questions[0].options);
});
test('randomization preserves correct-answer identity and does not mutate the bank', () => {
  for (let i = 0; i < 60; i++) {
    const shuffled = shuffleQuestions(questions);
    assert.equal(shuffled.length, 2);
    assert.equal(new Set(shuffled.map((q) => q.id)).size, 2);
    for (const q of shuffled) {
      const original = questions.find((o) => o.id === q.id);
      assert.equal(q.options[q.correct], original.options[original.correct]);
      assert.deepEqual([...q.options].sort(), [...original.options].sort());
    }
  }
  assert.equal(questions[0].correct, 1);
});
test('authoring rejects invalid banks and replaces untrusted question IDs', () => {
  for (const invalid of [
    null,
    [],
    [{ prompt: '', options: ['a', 'b'], correct: 0 }],
    [{ prompt: 'x', options: ['a', 'b'], correct: 5 }],
    [{ prompt: 'x', options: ['a', ''], correct: 0 }],
  ])
    assert.throws(() => validateQuestions(invalid));
  const bank = validateQuestions(questions);
  assert.notEqual(bank[0].id, questions[0].id);
  assert.equal(new Set(bank.map((q) => q.id)).size, 2);
});
test('password hashes are salted and reject incorrect passwords', async () => {
  const a = await hashPassword('a long sample password');
  const b = await hashPassword('a long sample password');
  assert.notEqual(a, b);
  assert.equal(await verifyPassword('a long sample password', a), true);
  assert.equal(await verifyPassword('incorrect', a), false);
  assert.equal(passwordValid('short'), false);
  assert.equal(passwordValid('a'.repeat(129)), false);
  assert.equal(safeEqual('abc', 'abcd'), false);
  assert.equal((await digest('secret')).length, 64);
});
test('payment verification binds status, reference, currency, amount and institution', () => {
  const record = {
    reference: 'tas-1',
    amount: 10000,
    institution_id: 'college-1',
  };
  const transaction = {
    status: 'success',
    reference: 'tas-1',
    currency: 'GHS',
    amount: 10000,
    metadata: { institution_id: 'college-1' },
  };
  assert.equal(paymentMatches(record, transaction), true);
  for (const alteration of [
    { status: 'pending' },
    { reference: 'tas-2' },
    { currency: 'USD' },
    { amount: 100 },
    { metadata: { institution_id: 'college-2' } },
  ])
    assert.equal(
      paymentMatches(record, { ...transaction, ...alteration }),
      false,
    );
});
test('course purchases bind the learner and course to the verified provider transaction', () => {
  const order = {
    reference: 'afc-course-1',
    amount: 19900,
    course_id: 'course-1',
    user_id: 'learner-1',
  };
  const transaction = {
    status: 'success',
    reference: 'afc-course-1',
    currency: 'GHS',
    amount: 19900,
    metadata: { course_id: 'course-1', user_id: 'learner-1' },
  };
  assert.equal(coursePaymentMatches(order, transaction), true);
  assert.equal(
    coursePaymentMatches(order, {
      ...transaction,
      metadata: { course_id: 'course-1', user_id: 'other-learner' },
    }),
    false,
  );
});
test('webhook signature rejects modified content and wrong keys', async () => {
  const raw = '{"event":"charge.success"}';
  const secret = 'test-secret';
  const signature = createHmac('sha512', secret).update(raw).digest('hex');
  assert.equal(await validWebhookSignature(raw, secret, signature), true);
  assert.equal(
    await validWebhookSignature(raw + ' ', secret, signature),
    false,
  );
  assert.equal(await validWebhookSignature(raw, 'wrong-key', signature), false);
  assert.equal(await validWebhookSignature(raw, secret, ''), false);
});
test('integrity events are allow-listed and provide a review signal without a cheating verdict', () => {
  assert.equal(isIntegrityEventType('focus_lost'), true);
  assert.equal(isIntegrityEventType('screen_capture'), false);
  assert.deepEqual(integrityRisk([{ event_type: 'focus_lost' }]), {
    score: 1,
    level: 'clear',
  });
  assert.deepEqual(
    integrityRisk([
      { event_type: 'visibility_hidden' },
      { event_type: 'clipboard_attempt' },
      { event_type: 'paste_attempt' },
      { event_type: 'fullscreen_exit' },
      { event_type: 'focus_lost' },
    ]),
    { score: 11, level: 'attention' },
  );
});
