const parseAdminEmails = () => {
  const raw = import.meta.env.VITE_ADMIN_EMAILS || '';
  return raw
    .split(/[;,\n]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

const ADMIN_EMAILS = parseAdminEmails();

export const isAdminUser = (user) => {
  if (!user) return false;

  const roles = [
    user.app_metadata?.role,
    user.user_metadata?.role,
    ...(Array.isArray(user.app_metadata?.roles) ? user.app_metadata.roles : []),
    ...(Array.isArray(user.user_metadata?.roles) ? user.user_metadata.roles : []),
  ]
    .filter(Boolean)
    .map((role) => String(role).trim().toLowerCase());

  if (roles.includes('admin') || roles.includes('super_admin')) return true;
  if (user.app_metadata?.is_admin === true || user.user_metadata?.is_admin === true) return true;

  const email = String(user.email || '').trim().toLowerCase();
  return ADMIN_EMAILS.includes(email);
};
