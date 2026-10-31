export function splitLines(value: string | undefined, fallback: string[]): string[] {
  if (!value?.trim()) return fallback
  const lines = value.split('\n').map((l) => l.trim()).filter(Boolean)
  return lines.length > 0 ? lines : fallback
}

export function splitEmailLines(email: string): [string, string] {
  const atIndex = email.indexOf('@')
  if (atIndex === -1) return [email, '']
  return [email.slice(0, atIndex + 1), email.slice(atIndex + 1)]
}

export function phoneHref(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return `tel:${phone}`
  // A 10-digit number is always a local Indian number, even if it starts with 91.
  const hasCountryCode = digits.length > 10 && digits.startsWith('91')
  return `tel:+${hasCountryCode ? digits : `91${digits}`}`
}
