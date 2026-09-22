// Flexible response rows are confined to the API adapter during this pilot.
// eslint-disable-next-line typescript/no-explicit-any
export type Row = Record<string, any>;
export type Snapshot = {
  user: Row;
  institution: Row;
  courses: Row[];
  modules: Row[];
  lessons: Row[];
  assessments: Row[];
  enrollments: Row[];
  attempts: Row[];
  completion: string[];
  events: Row[];
  payments: Row[];
  integrity: Row[];
  certificates: Row[];
  plans: Row[];
  billingReady: boolean;
  serverTime: number;
};
export async function api<T = Row>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(`/api/afc/${path}`, {
    method: data === undefined ? 'GET' : 'POST',
    headers: data === undefined ? {} : { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result = await responseData(response);
  if (!response.ok)
    throw new Error(result.error || 'Unable to complete this action.');
  return result as T;
}
export async function upload(path: string, file: File) {
  const body = new FormData();
  body.set('file', file);
  const response = await fetch(`/api/afc/${path}`, { method: 'POST', body });
  const result = await responseData(response);
  if (!response.ok) throw new Error(result.error || 'Upload failed.');
  return result;
}
async function responseData(response: Response): Promise<Row> {
  if (!response.headers.get('content-type')?.includes('application/json'))
    throw new Error(
      response.status === 403
        ? 'Access was denied. Refresh the page and try again.'
        : 'The service is unavailable. Please try again.',
    );
  return (await response.json()) as Row;
}
export const date = (value: number | string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-GH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Africa/Accra',
      })
    : 'No deadline';
export const initials = (name: string) =>
  (name || 'TAS')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');
