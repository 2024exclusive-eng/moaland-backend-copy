import fetch from 'node-fetch';
import { SiweMessage } from 'siwe';

export const VerifySigned = async (address, message, signature) => {
  try {
    const siweMessage = new SiweMessage(message);
    const verify = await siweMessage.verify({ signature });
    if (address !== verify.data.address) throw `ERROR: invalid address data`;
    return true;
  } catch (e) {
    throw e;
  }
};

const GetGoogleInfo = async idToken => {
  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`);

    const json = await response.json();
    return {
      id: json.sub,
      email: json.email,
      name: json.name,
    };
  } catch (e) {
    throw e;
  }
};

export const GetOauthId = async (oauthType, oauthCode) => {
  switch (oauthType) {
    case 'GOOGLE':
      return await GetGoogleInfo(oauthCode);
    default:
      return null;
  }
};

/** Discord Get Access Token
 *
 */
export const getDiscordOAuthToken = async (code, redirect) => {
  try {
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        redirect_uri: redirect,
        grant_type: 'authorization_code',
        code,
        scope: 'identify',
      }),
    });

    const data = await response.json();
    return data.access_token;
  } catch (e) {
    throw e;
  }
};

/** Discord Get User
 *
 */
export const getDiscordUser = async token => {
  try {
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (e) {
    throw e;
  }
};

/** Twitter Get Access Token
 *
 */
export const getTwitterOAuthToken = async (code, redirect) => {
  try {
    const basicAuthToken = Buffer.from(
      `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`,
      'utf8',
    ).toString('base64');

    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: process.env.TWITTER_CLIENT_ID,
        code_verifier: 'challenge',
        redirect_uri: redirect,
        grant_type: 'authorization_code',
        code,
        state: 'state',
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuthToken}`,
      },
    });

    const data = await response.json();
    return data.access_token;
  } catch (e) {
    throw e;
  }
};

/** Twitter Get User
 *
 */
export const getTwitterUser = async token => {
  try {
    const response = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data.data;
  } catch (e) {
    throw e;
  }
};
