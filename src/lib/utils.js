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

export function getMyRole(workspace, user) {
  if (!workspace || !user) return 'viewer';
  const member = workspace.members?.find((m) => {
    const memberId = m.user?._id || m.user;
    const userId = user._id || user.id;
    if (memberId && userId && memberId.toString() === userId.toString()) return true;
    if (m.user?.email && user.email && m.user.email.toLowerCase() === user.email.toLowerCase()) return true;
    return false;
  });
  return member?.role || workspace.myRole || 'viewer';
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
