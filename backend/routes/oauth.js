import express from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();

// PKCE: code_verifier aur code_challenge generate karo
function generatePKCE() {
  // Random 64-character string
  const verifier = crypto.randomBytes(32).toString('base64url');
  // SHA256 hash
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
  return { verifier, challenge };
}

router.get('/login', (req, res) => {
  const { verifier, challenge } = generatePKCE();

  // Session mein verifier save karo (baad mein use karenge)
  req.session.codeVerifier = verifier;

  const url = `${process.env.SF_LOGIN_URL}/services/oauth2/authorize` +
    `?response_type=code` +
    `&client_id=${process.env.SF_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.SF_REDIRECT_URI)}` +
    `&code_challenge=${challenge}` +
    `&code_challenge_method=S256`;

  res.redirect(url);
});

router.get('/callback', async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/?error=${encodeURIComponent(error_description)}`);
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.SF_CLIENT_ID,
      client_secret: process.env.SF_CLIENT_SECRET,
      redirect_uri: process.env.SF_REDIRECT_URI,
      code_verifier: req.session.codeVerifier
    });

    const { data } = await axios.post(
      `${process.env.SF_LOGIN_URL}/services/oauth2/token`,
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    req.session.accessToken = data.access_token;
    req.session.instanceUrl = data.instance_url;
    req.session.refreshToken = data.refresh_token;

    console.log('✅ Login successful');
    res.redirect(`${process.env.FRONTEND_URL}/?loggedIn=true`);
  } catch (err) {
    console.error('❌ Token exchange failed:', err.response?.data || err.message);
    res.redirect(`${process.env.FRONTEND_URL}/?error=oauth_failed`);
  }
});

router.get('/status', (req, res) => {
  res.json({
    loggedIn: !!req.session.accessToken,
    instanceUrl: req.session.instanceUrl || null
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

export default router;