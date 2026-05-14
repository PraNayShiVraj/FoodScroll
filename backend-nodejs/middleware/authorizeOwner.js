const User = require('../models/User');

/**
 * Reusable Ownership Authorization Middleware
 * 
 * Must be used AFTER the `auth` middleware (which sets req.user from JWT).
 * 
 * This middleware checks if the authenticated user (from the JWT token)
 * is the same as the user being targeted by the request.
 * 
 * It supports two modes:
 *   1. Route param mode  — checks req.params[paramName] (e.g., :id) directly against the JWT user ID
 *   2. Self-only mode    — no param needed, restricts the route to the token owner only
 * 
 * Usage examples:
 *   router.put('/profile/:id', auth, authorizeOwner('id'), handler)
 *   router.put('/update-profile', auth, authorizeOwner(), handler)  // self-only
 * 
 * @param {string} [paramName] - The route param name containing the target user's MongoDB _id.
 *                                If omitted, the middleware simply confirms the JWT user exists.
 */
function authorizeOwner(paramName) {
  return async (req, res, next) => {
    try {
      // req.user is set by the auth middleware (decoded JWT payload)
      const tokenUserId = req.user?.id;

      if (!tokenUserId) {
        return res.status(401).json({ detail: 'Authentication required' });
      }

      // If a route param is specified, compare the param ID directly against the JWT user ID
      // No DB lookup needed — the param IS the MongoDB _id
      if (paramName && req.params[paramName]) {
        const targetId = req.params[paramName];

        if (targetId !== tokenUserId) {
          return res.status(403).json({
            detail: 'Forbidden: You can only modify your own profile'
          });
        }
      }

      // Self-only mode: verify the token user still exists in the database
      if (!paramName) {
        const tokenUser = await User.findById(tokenUserId).lean();
        if (!tokenUser) {
          return res.status(404).json({ detail: 'Authenticated user not found' });
        }
      }

      next();
    } catch (err) {
      console.error('Authorization error:', err);
      return res.status(500).json({ detail: 'Authorization check failed' });
    }
  };
}

module.exports = authorizeOwner;
