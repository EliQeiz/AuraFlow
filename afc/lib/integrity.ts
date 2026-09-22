export const integrityEventTypes = [
  'assessment_opened',
  'focus_lost',
  'visibility_hidden',
  'fullscreen_exit',
  'clipboard_attempt',
  'paste_attempt',
  'connection_lost',
  'connection_restored',
] as const;

export type IntegrityEventType = (typeof integrityEventTypes)[number];

const eventWeights: Record<IntegrityEventType, number> = {
  assessment_opened: 0,
  focus_lost: 1,
  visibility_hidden: 2,
  fullscreen_exit: 2,
  clipboard_attempt: 3,
  paste_attempt: 3,
  connection_lost: 0,
  connection_restored: 0,
};

export function isIntegrityEventType(value: unknown): value is IntegrityEventType {
  return (
    typeof value === 'string' &&
    integrityEventTypes.includes(value as IntegrityEventType)
  );
}

export function integrityRisk(events: Array<{ event_type: IntegrityEventType }>) {
  const score = events.reduce((total, event) => total + eventWeights[event.event_type], 0);
  return {
    score,
    level: score >= 12 ? 'review' : score >= 5 ? 'attention' : 'clear',
  } as const;
}
