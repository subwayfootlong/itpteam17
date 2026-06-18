export function getErrorMessage(error: unknown, fallback = 'Request failed') {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallback;
}
