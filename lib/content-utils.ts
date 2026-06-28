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
  return digits ? `tel:+${digits.startsWith('91') ? digits : `91${digits}`}` : `tel:${phone}`
}
