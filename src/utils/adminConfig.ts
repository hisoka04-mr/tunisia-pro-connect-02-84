// Configuration for admin user emails
// Add your admin emails here
export const ADMIN_EMAILS = [
  'admin@servigo.com',
  'admin@admin.com',
  'support@servigo.com'
];

export const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};