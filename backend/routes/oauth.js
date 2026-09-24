import express from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PKCE Generator
|--------------------------------------------------------------------------
*/

function generatePKCE() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');

  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return {
    codeVerifier,
    codeChallenge
  };
}


/*
|--------------------------------------------------------------------------
| Salesforce Login
| GET /oauth/login
|--------------------------------------------------------------------------
*/

router.get('/login', (req, res) => {
  try {
    const { codeVerifier, codeChallenge } = generatePKCE();

    // Store verifier in session
    req.session.codeVerifier = codeVerifier;

    console.log('🔐 Salesforce login started');
    console.log('Session ID:', req.sessionID);
    console.log(
      'Code verifier stored:',
      !!req.session.codeVerifier
    );

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.SF_CLIENT_ID,
      redirect_uri: process.env.SF_REDIRECT_URI,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    const authorizationUrl =
      `${process.env.SF_LOGIN_URL}/services/oauth2/authorize?${params.toString()}`;

    res.redirect(authorizationUrl);

  } catch (error) {
    console.error('❌ Salesforce login error:', error);

    res.status(500).json({
      error: 'oauth_login_failed'
    });
  }
});


/*
|--------------------------------------------------------------------------
| Salesforce OAuth Callback
| GET /oauth/callback
|--------------------------------------------------------------------------
*/

router.get('/callback', async (req, res) => {
  const {
    code,
    error,
    error_description
  } = req.query;

  console.log('========================================');
  console.log('🔐 Salesforce OAuth callback');
  console.log('========================================');

  console.log('Code exists:', !!code);
  console.log('Session ID:', req.sessionID);
  console.log(
    'Code verifier exists:',
    !!req.session.codeVerifier
  );

  console.log(
    'Redirect URI:',
    process.env.SF_REDIRECT_URI
  );


  /*
  |--------------------------------------------------------------------------
  | Salesforce returned an error
  |--------------------------------------------------------------------------
  */

  if (error) {
    console.error('❌ Salesforce OAuth error:', {
      error,
      error_description
    });

    return res.redirect(
      `${process.env.FRONTEND_URL}/?error=${encodeURIComponent(
        error_description || error
      )}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Authorization code missing
  |--------------------------------------------------------------------------
  */

  if (!code) {
    console.error('❌ Authorization code missing');

    return res.redirect(
      `${process.env.FRONTEND_URL}/?error=authorization_code_missing`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | PKCE verifier missing
  |--------------------------------------------------------------------------
  */

  if (!req.session.codeVerifier) {
    console.error(
      '❌ PKCE code verifier missing from session'
    );

    return res.redirect(
      `${process.env.FRONTEND_URL}/?error=pkce_verifier_missing`
    );
  }


  try {

    /*
    |--------------------------------------------------------------------------
    | Exchange Authorization Code for Access Token
    |--------------------------------------------------------------------------
    */

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.SF_CLIENT_ID,
      client_secret: process.env.SF_CLIENT_SECRET,
      redirect_uri: process.env.SF_REDIRECT_URI,
      code: code,
      code_verifier: req.session.codeVerifier
    });

    console.log('🔄 Sending token request to Salesforce');

    console.log(
      'Client ID exists:',
      !!process.env.SF_CLIENT_ID
    );

    console.log(
      'Client secret exists:',
      !!process.env.SF_CLIENT_SECRET
    );

    console.log(
      'Code verifier exists:',
      !!req.session.codeVerifier
    );

    console.log(
      'Redirect URI:',
      process.env.SF_REDIRECT_URI
    );


    const response = await axios.post(
      `${process.env.SF_LOGIN_URL}/services/oauth2/token`,
      params.toString(),
      {
        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded'
        }
      }
    );


    const data = response.data;


    /*
    |--------------------------------------------------------------------------
    | Save Salesforce Session
    |--------------------------------------------------------------------------
    */

    req.session.accessToken = data.access_token;
    req.session.instanceUrl = data.instance_url;
    req.session.refreshToken =
      data.refresh_token || null;


    /*
    |--------------------------------------------------------------------------
    | Explicitly Save Session
    |--------------------------------------------------------------------------
    */

    req.session.save((err) => {

      if (err) {
        console.error(
          '❌ Session save failed:',
          err
        );

        return res.redirect(
          `${process.env.FRONTEND_URL}/?error=session_save_failed`
        );
      }

      console.log('✅ Salesforce login successful');
      console.log('✅ Session saved successfully');

      return res.redirect(
        `${process.env.FRONTEND_URL}/?loggedIn=true`
      );
    });

  } catch (error) {

    console.error(
      '❌ Token exchange failed:',
      error.response?.data || error.message
    );

    console.error(
      'Salesforce HTTP status:',
      error.response?.status || 'N/A'
    );

    return res.redirect(
      `${process.env.FRONTEND_URL}/?error=oauth_failed`
    );
  }
});


/*
|--------------------------------------------------------------------------
| OAuth Status
| GET /oauth/status
|--------------------------------------------------------------------------
*/

router.get('/status', (req, res) => {
  res.json({
    loggedIn: !!req.session.accessToken,
    instanceUrl: req.session.instanceUrl || null
  });
});


/*
|--------------------------------------------------------------------------
| Logout
| GET /oauth/logout
|--------------------------------------------------------------------------
*/

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {

    if (err) {
      console.error(
        '❌ Logout failed:',
        err
      );

      return res.status(500).json({
        error: 'logout_failed'
      });
    }

    res.json({
      ok: true
    });
  });
});


