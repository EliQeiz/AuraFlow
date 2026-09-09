import { z } from 'zod'

export const workSchema = z.object({
  kind: z.enum(['milestone', 'review', 'change']),
  title: z.string().trim().min(3).max(160),
  details: z.string().trim().max(4000),
  dueDate: z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/),
  assignedTo: z.enum(['client', 'team']),
  url: z
    .string()
    .max(2048)
    .refine(
      (value) => !value || (/^https:\/\//i.test(value) && URL.canParse(value)),
      'Use a valid HTTPS URL.',
    ),
})
export type WorkInput = z.infer<typeof workSchema>
export type WorkState =
  'open' | 'done' | 'approved' | 'changes-requested' | 'accepted' | 'declined'
export type WorkItem = WorkInput & {
  id: string
  state: WorkState
  response: string
  authorId: string
  updatedBy: string
  createdAt?: unknown
  updatedAt?: unknown
  lastEventId: string
}
export type ProjectEvent = {
  id: string
  projectId: string
  userId: string
  actorId: string
  entityId: string
  kind: string
  title: string
  state: string
  createdAt?: unknown
}
export function canTransition(
  item: Pick<WorkItem, 'kind' | 'state' | 'assignedTo'>,
  next: WorkState,
  admin: boolean,
) {
  if (item.kind === 'milestone')
    return (
      (admin || item.assignedTo === 'client') &&
      ((item.state === 'open' && next === 'done') ||
        (item.state === 'done' && next === 'open'))
    )
  if (item.kind === 'review')
    return (
      !admin &&
      item.state === 'open' &&
      ['approved', 'changes-requested'].includes(next)
    )
  return (
    admin &&
    ((item.state === 'open' && ['accepted', 'declined'].includes(next)) ||
      (item.state === 'accepted' && next === 'done'))
  )
}
export const prioritySchema = z.enum(['normal', 'high', 'urgent'])
export type ProjectOps = {
  id: string
  priority: z.infer<typeof prioritySchema>
}
export type ReplySnippet = { id: string; title: string; text: string }
export function csvCell(value: unknown) {
  const text = String(value ?? '')
  // Neutralize spreadsheet formulas even when preceded by whitespace/control characters.
  // eslint-disable-next-line no-control-regex
  const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(text) ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}
