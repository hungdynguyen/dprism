export function apiErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Không thể hoàn tất thao tác. Vui lòng thử lại.';
  try {
    const parsed: unknown = JSON.parse(error.message);
    if (
      typeof parsed === 'object' &&
      parsed &&
      'detail' in parsed &&
      typeof parsed.detail === 'string'
    )
      return parsed.detail;
  } catch {
    /* The API may return a plain-text error. */
  }
  return error.message;
}
