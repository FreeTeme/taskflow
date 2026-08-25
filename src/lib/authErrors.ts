export function getAuthErrorMessage(message: string, code?: string): string {
  const normalized = message.toLowerCase()
  const errorCode = code?.toLowerCase() ?? ''

  if (
    errorCode === 'email_not_confirmed' ||
    normalized.includes('email not confirmed')
  ) {
    return 'Confirm your email before signing in. Open the confirmation link we sent, then try again.'
  }

  if (
    errorCode === 'invalid_credentials' ||
    normalized.includes('invalid login credentials')
  ) {
    return 'The email or password is incorrect. Check both fields and try again.'
  }

  if (normalized.includes('network') || normalized.includes('fetch')) {
    return 'Unable to connect. Check your connection and try again.'
  }

  return 'Unable to complete sign-in. Check your details and try again.'
}
