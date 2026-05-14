/**
 * Centralised form validation helpers.
 * Returns an error string if the check fails, undefined otherwise.
 * Usage:
 *   const errs: Record<string, string> = {};
 *   chk(errs, 'fieldName', req(value));
 *   chk(errs, 'file',      reqFile(storedName));
 */

/** Attach an error message for a field (only if there is one). */
export function chk(
  errs: Record<string, string>,
  field: string,
  message: string | undefined,
): void {
  if (message) errs[field] = message;
}

/** Required text/textarea — trims whitespace. */
export function req(
  value: string,
  message = 'This field is required',
): string | undefined {
  return value?.trim() ? undefined : message;
}

/** Required select — value must be non-empty and not the placeholder sentinel. */
export function reqSelect(
  value: string,
  message = 'Please make a selection',
  ...sentinels: string[]
): string | undefined {
  const invalid = ['', 'Select', 'select', ...sentinels];
  return invalid.includes(value?.trim()) ? message : undefined;
}

/** Required file upload — storedName must be a non-empty string. */
export function reqFile(
  storedName: string,
  message = 'This document is required',
): string | undefined {
  return storedName?.trim() ? undefined : message;
}

/** Required radio — must be set to a meaningful value. */
export function reqRadio(
  value: string,
  message = 'Please select Yes or No',
): string | undefined {
  return value?.trim() ? undefined : message;
}

/** Word count — fails when the text exceeds the limit. */
export function maxWords(
  value: string,
  limit: number,
  message?: string,
): string | undefined {
  const count = value?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  if (count > limit) return message ?? `Must not exceed ${limit} words`;
  return undefined;
}

/**
 * Convenience: run an array of [fieldKey, errorString | undefined] tuples and
 * populate the error map in one go.
 *
 * Example:
 *   checks(errs, [
 *     ['applicantName', req(d.applicantName)],
 *     ['licenseCopy',   reqFile(d.licenseCopy)],
 *   ]);
 */
export function checks(
  errs: Record<string, string>,
  entries: Array<[string, string | undefined]>,
): void {
  for (const [field, message] of entries) {
    if (message) errs[field] = message;
  }
}
