/**
 * Azure Container Instances deployment logic.
 *
 * Deploys a container image to Azure Container Instances via the Azure Management REST API.
 * Authentication uses OAuth2 client credentials flow (service principal).
 *
 * Required env vars:
 *   AZURE_SUBSCRIPTION_ID  — Azure subscription ID
 *   AZURE_TENANT_ID        — Azure tenant ID (for service principal auth)
 *   AZURE_CLIENT_ID        — Azure client ID (for service principal auth)
 *   AZURE_CLIENT_SECRET    — Azure client secret (for service principal auth)
 *   AZURE_CONTAINER_IMAGE  — Docker image URI
 *   AZURE_RESOURCE_GROUP   — Resource group name (default: axon-rg)
 *   AZURE_REGION           — Azure region (default: eastus)
 *
 * Fallback (dev/testing):
 *   AZURE_BEARER_TOKEN     — Manually-obtained bearer token
 */

import { ProviderNotImplementedError } from '../../types.js';
import type { DeploymentConfig, Deployment, CostEstimate } from '../../types.js';
import { getPricing } from '../../pricing/index.js';
import { getAzureAccessToken } from './auth.js';

const ACI_API_VERSION = '2023-05-01';

export async function azureDeploy(options: { config: DeploymentConfig }): Promise<Deployment> {
  const subscriptionId = process.env['AZURE_SUBSCRIPTION_ID'];
  const containerImage = process.env['AZURE_CONTAINER_IMAGE'];
  const resourceGroup = process.env['AZURE_RESOURCE_GROUP'] ?? 'axon-rg';
  const region = process.env['AZURE_REGION'] ?? 'eastus';

  if (!subscriptionId) throw new ProviderNotImplementedError('azure', 'AZURE_SUBSCRIPTION_ID env var is required.');
  if (!containerImage) throw new ProviderNotImplementedError('azure', 'AZURE_CONTAINER_IMAGE env var is required.');

  const bearerToken = await getAzureAccessToken();

  const config = options.config;
  const containerGroupName = `axon-${Date.now()}`;

  const envVars = Object.entries(config.environment ?? {}).map(([name, value]) => ({ name, value }));

  const body = {
    location: region,
    properties: {
      containers: [
        {
          name: 'axon-container',
          properties: {
            image: containerImage,
            environmentVariables: envVars,
            resources: {
              requests: {
                cpu: 1,
                memoryInGB: 0.5,
              },
            },
            ports: [{ port: 443, protocol: 'TCP' }],
          },
        },
      ],
      osType: 'Linux',
      restartPolicy: 'Always',
      ipAddress: {
        type: 'Public',
        dnsNameLabel: containerGroupName,
        ports: [{ port: 443, protocol: 'TCP' }],
      },
    },
  };

  const url =
    `https://management.azure.com/subscriptions/${subscriptionId}` +
    `/resourceGroups/${resourceGroup}` +
    `/providers/Microsoft.ContainerInstance/containerGroups/${containerGroupName}` +
    `?api-version=${ACI_API_VERSION}`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    throw new Error(`Azure ACI CreateOrUpdate failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as {
    id: string;
    properties?: {
      ipAddress?: { fqdn?: string; ip?: string };
      provisioningState?: string;
    };
  };

  const fqdn = data.properties?.ipAddress?.fqdn ?? containerGroupName;
  const containerUrl = `https://${fqdn}`;

  return {
    id: data.id ?? containerGroupName,
    provider: 'azure',
    status: data.properties?.provisioningState === 'Succeeded' ? 'live' : 'pending',
    processorIds: [containerUrl],
    createdAt: new Date(),
    url: containerUrl,
  };
}

export async function azureEstimate(config: DeploymentConfig): Promise<CostEstimate> {
  const durationSec = (config.schedule?.durationMs ?? 3_600_000) / 1000;
  const replicas = config.replicas ?? 1;
  const memoryGib = 0.5;

  const pricing = await getPricing();
  const computeCost = (pricing.azureAciVcpuSec + pricing.azureAciGibSec * memoryGib) * durationSec * replicas;

  return {
    provider: 'azure',
    token: 'USD',
    amount: computeCost,
    usdEquivalent: computeCost,
  };
}

export async function azureListDeployments(): Promise<Array<{
  id: string; status: string; processorIds: string[];
}>> {
  const subscriptionId = process.env['AZURE_SUBSCRIPTION_ID'];
  const resourceGroup = process.env['AZURE_RESOURCE_GROUP'] ?? 'axon-rg';

  if (!subscriptionId) return [];

  try {
    const bearerToken = await getAzureAccessToken();
    const url =
      `https://management.azure.com/subscriptions/${subscriptionId}` +
      `/resourceGroups/${resourceGroup}` +
      `/providers/Microsoft.ContainerInstance/containerGroups` +
      `?api-version=${ACI_API_VERSION}`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${bearerToken}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];

    const data = await res.json() as {
      value?: Array<{
        id: string;
        name: string;
        properties?: {
          provisioningState?: string;
          ipAddress?: { fqdn?: string };
        };
      }>;
    };

    return (data.value ?? [])
      .filter(g => g.name.startsWith('axon-'))
      .map(g => {
        const fqdn = g.properties?.ipAddress?.fqdn ?? g.name;
        return {
          id: g.id,
          status: g.properties?.provisioningState === 'Succeeded' ? 'live' : 'pending',
          processorIds: [`https://${fqdn}`],
        };
      });
  } catch {
    return [];
  }
}

export async function azureTeardown(deploymentId: string): Promise<void> {
  const subscriptionId = process.env['AZURE_SUBSCRIPTION_ID'];
  const resourceGroup = process.env['AZURE_RESOURCE_GROUP'] ?? 'axon-rg';
  if (!subscriptionId) return;

  try {
    const bearerToken = await getAzureAccessToken();
    // deploymentId may be the container group name or full Azure resource ID
    const name = deploymentId.includes('/') ? deploymentId.split('/').pop()! : deploymentId;
    const url =
      `https://management.azure.com/subscriptions/${subscriptionId}` +
      `/resourceGroups/${resourceGroup}` +
      `/providers/Microsoft.ContainerInstance/containerGroups/${name}` +
      `?api-version=${ACI_API_VERSION}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${bearerToken}` },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`ACI delete failed: ${res.status}`);
    }
  } catch {
    // Best effort
  }
}
