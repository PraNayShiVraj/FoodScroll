/**
 * Google OAuth Authorization Code Verification Middleware
 * 
 * Receives a one-time authorization code from the frontend,
 * exchanges it for tokens using GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
 * (stored securely in .env), then fetches the user profile.
 * 
 * On success, attaches the Google user profile to `req.googleUser`.
 * 
 * Usage:
 *   router.post('/auth/google', verifyGoogleToken, handler)
 */

async function verifyGoogleToken(req, res, next) {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ detail: 'Google authorization code is required' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env');
    return res.status(500).json({ detail: 'Google OAuth not configured on server' });
  }

  try {
    // 1. Exchange the authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: 'postmessage',  // Required for popup-based flow
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errData = await tokenRes.json().catch(() => ({}));
      console.error('Google token exchange failed:', JSON.stringify(errData, null, 2));
      // Return the specific Google error to help debugging
      const errorMsg = errData.error === 'redirect_uri_mismatch'
        ? 'redirect_uri mismatch — add http://localhost:5173 to Google Cloud Console authorized origins'
        : errData.error === 'invalid_grant'
        ? 'Auth code expired or already used — try logging in again'
        : `Failed to exchange Google authorization code (${errData.error || 'unknown'})`;
      return res.status(401).json({ detail: errorMsg });
    }

    const tokenData = await tokenRes.json();

    // 2. Use the access token to fetch user profile
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) {
      return res.status(401).json({ detail: 'Failed to fetch Google user info' });
    }

    const googleUser = await userInfoRes.json();

    if (!googleUser.email) {
      return res.status(400).json({ detail: 'Google account does not have an email' });
    }

    // 3. Attach verified Google profile for downstream route handlers
    req.googleUser = {
      googleId: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    };

    next();
  } catch (err) {
    console.error('Google Token Verification Error:', err);
    return res.status(500).json({ detail: 'Failed to verify Google authorization' });
  }
}

module.exports = verifyGoogleToken;
