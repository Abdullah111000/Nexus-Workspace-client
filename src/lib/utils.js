const rank = { viewer: 1, member: 2, admin: 3, owner: 4 };

export function canEdit(role) {
  return (rank[role] || 0) >= 2;
}

export function canAdmin(role) {
  return (rank[role] || 0) >= 3;
}

export function isOwner(role) {
  return role === 'owner';
}

export const PRIORITY = ['low', 'medium', 'high', 'urgent'];

export function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function uid() {
  return crypto.randomUUID?.() || String(Date.now());
}
