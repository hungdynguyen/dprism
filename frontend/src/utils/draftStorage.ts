import type { CaseDraft, ExpertInput } from '@/types';
export function readCaseRecovery(key: string, remote: CaseDraft): CaseDraft {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || 'null') as CaseDraft | null;
    if (
      value?.id === remote.id &&
      !remote.runId &&
      value.revision > remote.revision &&
      Array.isArray(value.tasks) &&
      Array.isArray(value.documents) &&
      typeof value.context?.task === 'string'
    )
      return value;
  } catch {
    /* Corrupt recovery data must not prevent loading the server version. */
  }
  return structuredClone(remote);
}
export function readExpertRecovery(key: string, initial: ExpertInput): ExpertInput {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || 'null') as ExpertInput | null;
    if (
      value &&
      typeof value.role === 'string' &&
      typeof value.approach === 'string' &&
      typeof value.systemPrompt === 'string' &&
      typeof value.domain === 'string' &&
      Array.isArray(value.skillIds)
    )
      return value;
  } catch {
    /* Fall back to the fetched profile. */
  }
  return initial;
}
export function writeRecovery(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Network persistence is still available if browser storage is full. */
  }
}
export function clearRecovery(key: string) {
  sessionStorage.removeItem(key);
}
