// Only messages deliberately returned by our API are suitable for display.
export class PublicRequestError extends Error {}

export function getErrorMessage(error: unknown, fallback = 'Request failed') {
  if (error instanceof PublicRequestError) {
    return error.message;
  }

  return fallback;
}
