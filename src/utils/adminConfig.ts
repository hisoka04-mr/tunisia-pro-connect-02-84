// Configuration for admin user emails
// Add your admin emails here
export const ADMIN_EMAILS = [
  'admin@sevigo.com',
  'admin@admin.com',
  'support@sevigo.com'
];

export const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};