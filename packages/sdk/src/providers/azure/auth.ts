import { ProviderNotImplementedError } from '../../types.js';

interface TokenCache {
  token: string;
  expiresAt: number;
}

let _azureTokenCache: TokenCache | null = null;

export async function getAzureAccessToken(): Promise<string> {
  if (_azureTokenCache && _azureTokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
    return _azureTokenCache.token;
  }

  const tenantId = process.env['AZURE_TENANT_ID'];
  const clientId = process.env['AZURE_CLIENT_ID'];
  const clientSecret = process.env['AZURE_CLIENT_SECRET'];

  // Also accept a manually-provided token as fallback (for dev/testing)
  const manualToken = process.env['AZURE_BEARER_TOKEN'];

  if (!tenantId || !clientId || !clientSecret) {
    if (manualToken) {
      // Manual token doesn't get cached (we don't know its expiry)
      return manualToken;
    }
    throw new ProviderNotImplementedError(
      'azure',
      'Azure credentials required. Set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET ' +
      '(from your service principal), or run: az account get-access-token'
    );
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://management.azure.com/.default',
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new ProviderNotImplementedError('azure', `Azure token request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  _azureTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return data.access_token;
}

export function clearAzureTokenCache(): void {
  _azureTokenCache = null;
}
