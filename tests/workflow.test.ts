import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canTransition, csvCell, workSchema } from '../src/domain/workflow'

test('workflow transition matrix keeps approvals with clients and triage with admins', () => {
  assert.equal(
    canTransition(
      { kind: 'review', state: 'open', assignedTo: 'client' },
      'approved',
      false,
    ),
    true,
  )
  assert.equal(
    canTransition(
      { kind: 'review', state: 'open', assignedTo: 'client' },
      'approved',
      true,
    ),
    false,
  )
  assert.equal(
    canTransition(
      { kind: 'review', state: 'approved', assignedTo: 'client' },
      'changes-requested',
      false,
    ),
    false,
  )
  assert.equal(
    canTransition(
      { kind: 'milestone', state: 'open', assignedTo: 'team' },
      'done',
      false,
    ),
    false,
  )
  assert.equal(
    canTransition(
      { kind: 'milestone', state: 'open', assignedTo: 'client' },
      'done',
      false,
    ),
    true,
  )
  assert.equal(
    canTransition(
      { kind: 'change', state: 'open', assignedTo: 'team' },
      'accepted',
      true,
    ),
    true,
  )
  assert.equal(
    canTransition(
      { kind: 'change', state: 'open', assignedTo: 'team' },
      'accepted',
      false,
    ),
    false,
  )
  assert.equal(
    canTransition(
      { kind: 'change', state: 'accepted', assignedTo: 'team' },
      'done',
      true,
    ),
    true,
  )
})
test('workflow links and exports reject script URLs and neutralize spreadsheet formulas', () => {
  const input = {
    kind: 'review',
    title: 'Design version 1',
    details: '',
    dueDate: '',
    assignedTo: 'client',
    url: '',
  }
  assert.equal(workSchema.safeParse(input).success, true)
  for (const url of [
    'javascript:alert(1)',
    'data:text/html,hello',
    'http://example.com',
    'https://',
  ])
    assert.equal(workSchema.safeParse({ ...input, url }).success, false)
  assert.equal(csvCell('=IMPORTXML("url")'), '"\'=IMPORTXML(""url"")"')
  assert.equal(csvCell('\t+SUM(A1)'), '"\'\t+SUM(A1)"')
  assert.equal(csvCell('Normal, "value"'), '"Normal, ""value"""')
})
