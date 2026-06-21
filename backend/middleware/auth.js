const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function authMiddleware(req, res, next) {
  // Allow unauthenticated access to auth routes and health
  if (req.path.startsWith('/auth') || req.path === '/' || req.path.startsWith('/public')) {
    return next();
  }

  // Development convenience: allow POSTs to sales and purchases without auth
  // Enable by default when not in production, or explicitly via DEV_AUTH_BYPASS=1
  const devBypass = process.env.DEV_AUTH_BYPASS === '1' || process.env.NODE_ENV !== 'production';
  if (devBypass) {
    const url = req.originalUrl || req.url || '';
    if (url.startsWith('/api/sales') || url.startsWith('/api/purchases') || url.startsWith('/sales') || url.startsWith('/purchases')) {
      return next();
    }
  }

  if (req.method === 'GET') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, username, role }
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

module.exports = { authMiddleware, requireRole };
