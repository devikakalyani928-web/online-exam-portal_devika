// Shared API base URL utility
// Strips trailing /api if present to avoid double /api/api/ in URLs
const getApiBase = () => {
  const base =
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_API_URL || // compatibility with existing Vercel env name
    'http://localhost:5000';
  // Remove trailing /api if it exists (some users might include it in env var)
  return base.replace(/\/api\/?$/, '');
};

export const API_BASE = getApiBase();
