export function maskPhone(phone = '') {
  if (phone.length < 4) return '••••';
  return `${phone.slice(0, 2)}${'•'.repeat(Math.max(0, phone.length - 4))}${phone.slice(-2)}`;
}

export function maskName(name = '') {
  const parts = name.trim().split(/\s+/);
  return parts.map((p) => (p.length <= 1 ? p : `${p[0]}${'•'.repeat(p.length - 1)}`)).join(' ');
}
