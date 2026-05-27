export const formatAuthError = (error: unknown, fallback = 'Authentication failed.') => {
  if (!error || typeof error !== 'object') return fallback;

  const message = 'message' in error ? String(error.message || '') : '';
  const status = 'status' in error ? String(error.status || '') : '';
  const code = 'code' in error ? String(error.code || '') : '';

  if (message.includes('Email not confirmed')) {
    return 'Please verify your email before signing in.';
  }

  if (message || code || status) {
    return [message, code ? `code=${code}` : '', status ? `status=${status}` : '']
      .filter(Boolean)
      .join(' | ');
  }

  return fallback;
};
