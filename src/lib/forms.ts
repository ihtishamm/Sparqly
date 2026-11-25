import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError, errorMessage } from './api/errors';

/**
 * Puts the API's field errors on matching form fields. Anything that doesn't
 * map to a field becomes a form-level error under `root.server`.
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly string[]
) {
  let unmatched: string | null = null;

  if (error instanceof ApiError) {
    for (const [field, message] of Object.entries(error.fieldErrors)) {
      if (fields.includes(field)) {
        setError(field as Path<T>, { type: 'server', message });
      } else {
        unmatched = message;
      }
    }
    if (!Object.keys(error.fieldErrors).length) unmatched = error.message;
  } else {
    unmatched = errorMessage(error);
  }

  if (unmatched) {
    setError('root.server' as Path<T>, { type: 'server', message: unmatched });
  }
}

/** Mirrors the backend password rule (AuthRegisterLoginDto). */
export const PASSWORD_RULE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
export const PASSWORD_HINT =
  'At least 8 characters, with upper and lower case letters, a number and a symbol (@$!%*?&).';
