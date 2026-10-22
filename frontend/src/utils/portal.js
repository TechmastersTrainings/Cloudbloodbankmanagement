// Shared portal-home resolver so multiple components can reuse it
// without duplicating logic (keeps files fast-refresh friendly).
export const portalHomeFor = (role) => {
  switch ((role || '').toUpperCase()) {
    case 'ADMIN': return '/admin/dashboard';
    case 'HOSPITAL': return '/hospital/dashboard';
    case 'DONOR': return '/donor/dashboard';
    case 'RECEIVER': return '/receiver/dashboard';
    default: return '/';
  }
};

export default portalHomeFor;
