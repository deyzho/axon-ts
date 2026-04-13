import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { ProviderNotImplementedError } from '../../types.js';

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key: string;
  client_email: string;
  token_uri: string;
}

interface TokenCache {
  token: string;
  expiresAt: number; // Date.now() ms
}

let _gcpTokenCache: TokenCache | null = null;

function base64url(data: string | Buffer): string {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function makeServiceAccountJwt(key: ServiceAccountKey): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: key.token_uri || 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));
  const input = `${header}.${payload}`;
  const sign = createSign('RSA-SHA256');
  sign.update(input, 'utf8');
  sign.end();
  const signature = base64url(sign.sign(key.private_key));
  return `${input}.${signature}`;
}

export async function getGcpAccessToken(): Promise<string> {
  // Return cached token if still valid (>5 min remaining)
  if (_gcpTokenCache && _gcpTokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
    return _gcpTokenCache.token;
  }

  const credsPath = process.env['GOOGLE_APPLICATION_CREDENTIALS'];
  if (!credsPath) {
    throw new ProviderNotImplementedError(
      'gcp',
      'GOOGLE_APPLICATION_CREDENTIALS env var is required. ' +
      'Point it to your service account JSON key file, or run: gcloud auth application-default login'
    );
  }

  let keyData: ServiceAccountKey;
  try {
    keyData = JSON.parse(readFileSync(credsPath, 'utf8')) as ServiceAccountKey;
  } catch (err) {
    throw new ProviderNotImplementedError('gcp', `Failed to read service account key at ${credsPath}: ${(err as Error).message}`);
  }

  if (keyData.type !== 'service_account') {
    throw new ProviderNotImplementedError('gcp', `Expected service_account key type, got: ${keyData.type}`);
  }

  const jwt = makeServiceAccountJwt(keyData);
  const tokenUri = keyData.token_uri || 'https://oauth2.googleapis.com/token';

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt,
  });

  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new ProviderNotImplementedError('gcp', `GCP token exchange failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  _gcpTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000, // 5 min buffer
  };

  return data.access_token;
}

/** Clear the token cache (useful for testing). */
export function clearGcpTokenCache(): void {
  _gcpTokenCache = null;
}
