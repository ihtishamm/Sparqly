import { describe, expect, it } from 'vitest';
import { ApiError, errorMessage, toApiError } from './errors';

describe('toApiError', () => {
  it('maps validation codes to field messages', () => {
    const error = toApiError(422, {
      status: 422,
      errors: { email: 'emailAlreadyExists', password: 'mustBeNotEmpty' }
    });
    expect(error.fieldErrors).toEqual({
      email: 'An account with this email already exists.',
      password: 'This field is required.'
    });
    expect(error.codes.email).toBe('emailAlreadyExists');
    expect(error.message).toBe('Some fields need attention.');
  });

  it('flattens nested errors to dotted paths', () => {
    const error = toApiError(422, {
      errors: { metadata: { title: 'mustBeNotEmpty' } }
    });
    expect(error.fieldErrors['metadata.title']).toBe('This field is required.');
    expect(error.message).toBe('This field is required.');
  });

  it('strips code details and humanizes unknown codes', () => {
    expect(
      toApiError(422, { errors: { email: 'needLoginViaProvider:google' } })
        .message
    ).toBe('This account signs in with Google.');
    expect(toApiError(422, { errors: { x: 'somethingOdd' } }).message).toBe(
      'Something Odd'
    );
  });

  it('explains upload problems', () => {
    expect(
      toApiError(422, { errors: { file: 'unsupportedFileType' } }).message
    ).toMatch(/MP4/);
    expect(toApiError(413, undefined).message).toMatch(/500 MB/);
  });

  it('falls back by status', () => {
    expect(toApiError(401, undefined).message).toMatch(/session/);
    expect(toApiError(429, {}).message).toMatch(/Too many/);
    expect(toApiError(500, {}).message).toMatch(/our side/);
  });

  it('detects insufficient credits', () => {
    expect(
      toApiError(422, { message: 'Insufficient credits', requiredCredits: 1 })
        .isInsufficientCredits
    ).toBe(true);
    expect(toApiError(422, {}).isInsufficientCredits).toBe(false);
  });
});

describe('errorMessage', () => {
  it('prefers the error’s own message', () => {
    expect(errorMessage(new ApiError('Nope', 400))).toBe('Nope');
    expect(errorMessage('weird', 'Fallback')).toBe('Fallback');
  });
});
