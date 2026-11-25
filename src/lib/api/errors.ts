/**
 * Errors from the API, normalised from the backend's two shapes:
 * validation errors `{ status, errors: { field: 'code' } }` and Nest's default
 * `{ statusCode, message, error }`.
 */
export class ApiError extends Error {
  readonly status: number;
  /** Field name → human-readable message, ready for form.setError. */
  readonly fieldErrors: Record<string, string>;
  /** Field name → raw backend code (e.g. `notActive`), for branching. */
  readonly codes: Record<string, string>;
  readonly data: unknown;

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string> = {},
    data?: unknown,
    codes: Record<string, string> = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.codes = codes;
    this.data = data;
  }

  get isInsufficientCredits() {
    return (
      this.status === 422 &&
      typeof this.data === 'object' &&
      this.data !== null &&
      'requiredCredits' in this.data
    );
  }
}

/** Backend error codes → copy shown to people. */
const CODE_MESSAGES: Record<string, string> = {
  emailAlreadyExists: 'An account with this email already exists.',
  usernameAlreadyExists: 'This username is taken.',
  cannotEdit: 'This post is publishing or already published.',
  mustBeInFuture: 'Pick a time in the future.',
  onlyFailedPostsCanBeRetried: 'Only failed posts can be retried.',
  cannotPublishNow: 'This post can’t be published now.',
  emailNotExists: 'No account uses this email.',
  notFound: 'Not found.',
  notExists: 'This item no longer exists.',
  notOwner: 'You don’t have access to this item.',
  notActive: 'Confirm your email before signing in.',
  incorrectPassword: 'Incorrect email or password.',
  incorrectOldPassword: 'Your current password is incorrect.',
  missingOldPassword: 'Enter your current password to set a new one.',
  invalidHash: 'This link is invalid or has expired.',
  hashExpired: 'This link has expired. Request a new one.',
  needLoginViaProvider: 'This account signs in with Google.',
  unsupportedUrl:
    'Use a public link from YouTube, Vimeo, TikTok, Instagram or a direct media file.',
  notEditable: 'This document can’t be edited.',
  videoTrackRequired: 'The timeline needs a video clip.',
  endTimeMustBeAfterStartTime: 'End time must be after the start time.',
  tooManyElements: 'The timeline has too many items.',
  tooLarge: 'This item is too large.',
  noBillingAccount:
    'You don’t have a billing account yet. Choose a plan first.',
  unknownPrice: 'This plan is no longer available.',
  publishingInProgress:
    'A post to this account is publishing right now. Try again in a minute.',
  alreadyProcessing: 'This post is publishing right now.',
  cannotCancel: 'This post is publishing or already published.',
  invalidHashtag: 'Hashtags can’t contain spaces or #.',
  mustBeNotEmpty: 'This field is required.',
  'Insufficient credits':
    'You’re out of credits. Top up in Billing to continue.'
};

function humanize(raw: string): string {
  // Some codes carry a detail: "needLoginViaProvider:google".
  const code = raw.includes(' ') ? raw : raw.split(':')[0];
  if (CODE_MESSAGES[code]) return CODE_MESSAGES[code];
  // class-validator messages are already sentences ("email must be an email").
  if (code.includes(' ')) return code.charAt(0).toUpperCase() + code.slice(1);
  return code
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * Nested DTO errors arrive as objects (`{ metadata: { title: 'code' } }`).
 * Flattens them to dotted paths, e.g. `metadata.title`.
 */
function flattenErrors(errors: unknown, prefix = ''): Array<[string, string]> {
  if (!errors || typeof errors !== 'object') return [];
  return Object.entries(errors as Record<string, unknown>).flatMap(
    ([key, value]): Array<[string, string]> => {
      const path = prefix ? `${prefix}.${key}` : key;
      return value && typeof value === 'object'
        ? flattenErrors(value, path)
        : [[path, String(value)]];
    }
  );
}

export function toApiError(status: number, body: unknown): ApiError {
  const data = (body ?? {}) as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};
  const codes: Record<string, string> = {};

  if (data.errors && typeof data.errors === 'object') {
    for (const [field, code] of flattenErrors(data.errors)) {
      codes[field] = code;
      fieldErrors[field] = humanize(code);
    }
  }

  let message: string;
  const fieldMessages = Object.values(fieldErrors);
  if (Array.isArray(data.message)) {
    message = humanize(String(data.message[0]));
  } else if (typeof data.message === 'string' && data.message) {
    message = humanize(data.message);
  } else if (fieldMessages.length === 1) {
    message = fieldMessages[0];
  } else if (fieldMessages.length > 1) {
    message = 'Some fields need attention.';
  } else if (status === 401) {
    message = 'Your session has ended. Sign in again.';
  } else if (status === 403) {
    message = 'You don’t have permission to do that.';
  } else if (status === 404) {
    message = 'Not found.';
  } else if (status === 429) {
    message = 'Too many attempts. Wait a minute and try again.';
  } else if (status >= 500) {
    message = 'Something went wrong on our side. Try again shortly.';
  } else {
    message = 'Request failed.';
  }

  if (status === 503) {
    message = humanize(String(data.message ?? 'Service unavailable.'));
  }

  return new ApiError(message, status, fieldErrors, body, codes);
}

export function errorMessage(
  error: unknown,
  fallback = 'Something went wrong.'
) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
