# Axon SDK

**Deploy AI to the edge. Any network, any device, one SDK.**

Axon is the deployment layer for edge AI. Run inference on decentralised compute networks — automatically routed to the fastest, cheapest option. One SDK. Zero lock-in.

Tired of OpenAI pricing? Need private inference? Building a dApp that requires reliable compute without AWS dependency? Axon routes your AI workloads to the best available edge compute — GPU clusters, TEE smartphones, container clouds — with a single interface across [io.net](https://io.net), [Akash Network](https://akash.network), [Acurast](https://acurast.com), [Fluence](https://fluence.network), and [Koii](https://koii.network).

Drop in the OpenAI-compatible `@axonsdk/inference` package and your existing code routes through decentralised GPU in two lines. Call your deployed processors directly from **iOS and Android** apps with `@axonsdk/mobile`.

> Axon is to edge compute what Ethers.js is to EVM chains: **one interface, any provider**.

---

## Supported providers

### Edge & Decentralised compute

| Provider | Status | Nodes | Runtime | Token |
|---|---|---|---|---|
| [io.net](https://io.net) | ✅ Supported | GPU clusters (A100, H100, RTX) | nodejs, python | IO |
| [Akash Network](https://akash.network) | ✅ Supported | Decentralised container marketplace | nodejs, docker | AKT |
| [Acurast](https://acurast.com) | ✅ Supported | 237k+ smartphones (TEE) | nodejs, wasm | ACU |
| [Fluence](https://fluence.network) | ✅ Supported | Decentralised serverless cloud | nodejs | FLT |
| [Koii](https://koii.network) | ✅ Supported | Community compute task nodes | nodejs | KOII |

### Cloud providers *(coming soon)*

| Provider | Status | Services | Runtime |
|---|---|---|---|
| [AWS](https://aws.amazon.com) | 🔜 Coming soon | Lambda, ECS / Fargate, EC2 | python, nodejs, docker |
| [Google Cloud](https://cloud.google.com) | 🔜 Coming soon | Cloud Run, Cloud Functions | python, nodejs, docker |
| [Azure](https://azure.microsoft.com) | 🔜 Coming soon | Container Instances, Functions | python, nodejs, docker |
| [Cloudflare Workers](https://workers.cloudflare.com) | 🔜 Coming soon | Workers, R2, AI Gateway | nodejs, wasm |
| [Fly.io](https://fly.io) | 🔜 Coming soon | Fly Machines | python, nodejs, docker |

> **Provider health dashboard:** Real-time status and latency for all networks → [status.axonsdk.dev](https://status.axonsdk.dev)

---

## Python SDK

Axon ships a Python-first SDK for AI/ML engineers and data scientists. It exposes the same provider interface, routing engine, and OpenAI-compatible inference handler — all in idiomatic async Python.

```bash
pip install axon              # core SDK
pip install axon[inference]   # + FastAPI OpenAI-compatible server
```

```python
from axon import AxonClient, AxonRouter, RoutingStrategy

# Single provider
async with AxonClient(provider="ionet", secret_key="...") as client:
    deployment = await client.deploy(config)
    await client.send(deployment.id, {"prompt": "Hello"})

# Multi-provider with auto-routing
async with AxonRouter(
    providers=["ionet", "akash", "acurast"],
    secret_key="...",
    strategy=RoutingStrategy.LATENCY,
) as router:
    deployment = await router.deploy(config)
```

```bash
axon init       # interactive project setup
axon auth ionet # configure credentials
axon deploy     # deploy your workload
axon status     # list active deployments
```

> The Python SDK is the primary implementation. The TypeScript packages below are the alternative track for JavaScript/TypeScript and React Native developers.

---

## Quick start (TypeScript / Node.js)

### 1. Install the CLI

```bash
npm install -g @axonsdk/cli
```

### 2. Initialise a new project

```bash
mkdir my-edge-app && cd my-edge-app
axon init
```

This will prompt you for a project name, provider, and template (inference / oracle / blank), then generate `axon.json`, `.env`, and `src/index.ts`.

### 3. Configure credentials

```bash
axon auth
```

The interactive wizard generates and stores all required keys and endpoints for your chosen provider. Your `.env` is automatically added to `.gitignore` and locked to owner-only permissions.

### 4. Test locally

```bash
axon run-local
```

Runs your script in a local mock environment — simulates WebSocket messages, real HTTPS requests, and the provider runtime API without touching the network.

### 5. Deploy

```bash
axon deploy
```

Bundles your script, uploads it to IPFS, and registers the deployment on-chain (or submits the SDL to Akash's marketplace).

```
✔ Deployment live!
  Deployment ID: 0xabc123...
  Processors:    3 matched
    • 0xproc1...
    • 0xproc2...
    • 0xproc3...
```

### 6. Call from your dApp

```typescript
import { AxonClient } from '@axonsdk/sdk';

const client = new AxonClient({
  provider: 'ionet', // 'ionet' | 'akash' | 'acurast' | 'fluence' | 'koii'
  secretKey: process.env.AXON_SECRET_KEY,
});

await client.connect();

client.onMessage((msg) => {
  const { result } = msg.payload as { result: string };
  console.log('Result:', result);
});

await client.send('0xproc1...', {
  requestId: 'req-001',
  prompt: 'Summarize: The quick brown fox...',
});

client.disconnect();
```

---

## CLI reference

| Command | Description |
|---|---|
| `axon init` | Interactive setup — generates `axon.json`, `.env`, and template files |
| `axon auth [provider]` | Credential wizard — generates and stores keys for the selected provider |
| `axon deploy` | Bundle, upload to IPFS, and register deployment |
| `axon run-local` | Run your script locally with a mock provider runtime |
| `axon status` | List deployments, processor IDs, and live status |
| `axon send <id> <msg>` | Send a test message to a processor node |
| `axon template list` | Show available built-in templates |

Supported values for `[provider]`: `ionet`, `akash`, `acurast`, `fluence`, `koii`

---

## SDK reference

```typescript
import { AxonClient } from '@axonsdk/sdk';
import type { DeploymentConfig } from '@axonsdk/sdk';

const client = new AxonClient({
  provider: 'ionet',  // 'ionet' | 'akash' | 'acurast' | 'fluence' | 'koii'
  secretKey: process.env.AXON_SECRET_KEY,
});

await client.connect();

// Estimate cost before deploying
const cost = await client.estimate({
  runtime: 'nodejs',
  code: './dist/index.js',
  schedule: { type: 'on-demand', durationMs: 86_400_000 },
  replicas: 1,
});
console.log(`Estimated: ${cost.amount} ${cost.token}`);
// e.g. "Estimated: 6000000000 AKT" (in uAKT)

// Deploy
const deployment = await client.deploy({
  runtime: 'nodejs',
  code: './dist/index.js',
  schedule: { type: 'on-demand', durationMs: 86_400_000 },
  replicas: 1,
});

// List deployments
const deployments = await client.listDeployments();

// Send a message to a processor / container
await client.send(deployment.processorIds[0], { prompt: 'Hello' });

// Receive results
const unsubscribe = client.onMessage((msg) => {
  console.log(msg.payload);
});

client.disconnect();
```

---

## OpenAI-compatible inference endpoint

`@axonsdk/inference` is a drop-in OpenAI-compatible HTTP handler that routes chat completion requests through Axon's decentralised GPU and TEE compute network. If you're already using the `openai` npm package, switching takes two lines:

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://your-api.example.com/v1', // your Axon inference handler URL
  apiKey:  process.env.AXON_SECRET_KEY,
});

// Everything else stays identical
const response = await client.chat.completions.create({
  model:    'axon-llama-3-70b',
  messages: [{ role: 'user', content: 'Explain edge AI in one paragraph.' }],
});
```

### Supported models

| Model ID | Provider | Notes |
|---|---|---|
| `axon-llama-3-70b` | io.net | GPU, A100 spot — best for large context |
| `axon-mistral-7b`  | io.net | GPU, cost-efficient |
| `axon-llama-3-8b`  | Akash  | Container cloud, moderate cost |
| `axon-tee-phi-3-mini` | Acurast | TEE smartphone, private, lowest cost |

### Setup (Next.js App Router)

```bash
npm install @axonsdk/inference
```

```typescript
// app/api/v1/chat/completions/route.ts
import { AxonInferenceHandler } from '@axonsdk/inference';

const handler = new AxonInferenceHandler({
  apiKey:        process.env.AXON_SECRET_KEY!,
  ionetEndpoint: process.env.IONET_ENDPOINT!,
  akashEndpoint: process.env.AKASH_ENDPOINT,
  acurastWsUrl:  process.env.ACURAST_WS_URL,
  strategy:      'cost', // 'cost' | 'latency' | 'balanced'
});

export const POST = (req: Request) => handler.handleRequest(req);
export const GET  = (req: Request) => handler.handleRequest(req); // GET /v1/models
```

The handler implements:
- `POST /v1/chat/completions` — streaming (SSE) and non-streaming
- `GET  /v1/models` — returns available model list
- Bearer auth, failover on provider error, 30-second auto-recovery
- `X-Axon-Provider` response header so you can see which network served each request

---

## Provider health dashboard

Real-time latency, health scores, and status for all five Axon providers — updated every 5 minutes:

**[status.axonsdk.dev](https://status.axonsdk.dev)**

---

## Multi-provider Router

`AxonRouter` routes requests across multiple DePIN providers simultaneously, picking the best one on every call based on real-time health data.

```typescript
import { AxonRouter } from '@axonsdk/sdk';

const router = new AxonRouter({
  providers: ['akash', 'acurast'],
  secretKey: process.env.AXON_SECRET_KEY,

  // Routing strategy: 'balanced' | 'latency' | 'availability' | 'cost' | 'round-robin'
  strategy: 'latency',

  // Processor selection within a provider: 'round-robin' | 'fastest' | 'random' | 'first'
  processorStrategy: 'fastest',

  // Circuit breaker — open after 3 consecutive failures, recover after 30s
  failureThreshold: 3,
  recoveryTimeoutMs: 30_000,

  maxRetries: 2,
  retryDelayMs: 200,
});

await router.connect();

// Deploy to ALL providers in parallel
const deployment = await router.deploy({
  runtime: 'nodejs',
  code: './dist/index.js',
  schedule: { type: 'on-demand', durationMs: 86_400_000 },
});
console.log(`Deployed to ${deployment.providers.length} providers`);
if (deployment.failedProviders.length) {
  console.warn('Failed providers:', deployment.failedProviders);
}

// Send — automatically picks the highest-scoring callable provider
await router.send({ prompt: 'Hello' });

// Force a specific provider
await router.send({ prompt: 'Hello' }, { preferProvider: 'akash' });

// Receive messages from all providers
const unsubscribe = router.onMessage((msg) => {
  console.log(msg.payload);
});

// Health snapshot — one entry per provider
router.health().forEach((h) => {
  console.log(h.provider, {
    score:       h.score.toFixed(3),
    latencyMs:   h.latencyMs,
    successRate: h.successRate,
    circuit:     h.circuitState,
  });
});

// Listen for routing events
router.onEvent((event) => {
  // event.type: 'provider:selected' | 'provider:failed' | 'circuit:opened' | 'retry' | 'failover' | ...
  console.log(event.type, event.provider);
});

router.disconnect();
```

### Routing strategies

| Strategy | Availability weight | Latency weight | Cost weight |
|---|---|---|---|
| `balanced` | 33% | 34% | 33% |
| `latency` | 10% | 85% | 5% |
| `availability` | 80% | 15% | 5% |
| `cost` | 10% | 5% | 85% |
| `round-robin` | — distributes evenly, ignores scores — | | |

---

## Mobile SDK (iOS & Android)

`@axonsdk/mobile` is a React Native / Expo package that lets you call your deployed Axon processors directly from iOS and Android apps.

```bash
npm install @axonsdk/mobile
```

### Quick start — Expo / React Native

```tsx
// App.tsx — wrap your root once
import { AxonProvider } from '@axonsdk/mobile';

export default function App() {
  return (
    <AxonProvider provider="akash" secretKey={AXON_SECRET_KEY} autoConnect>
      <NavigationContainer>
        <MainStack />
      </NavigationContainer>
    </AxonProvider>
  );
}

// AnyScreen.tsx — access from anywhere in the tree
import { useAxonContext, useMessages, useSend } from '@axonsdk/mobile';

export function InferenceScreen() {
  const { client, connected } = useAxonContext();
  const messages = useMessages(client);
  const { send, sending } = useSend(client);

  return (
    <View>
      <Text>{connected ? '🟢 Live' : '⚪ Offline'}</Text>
      <Button
        title={sending ? 'Sending...' : 'Run inference'}
        onPress={() => send(AKASH_LEASE_URL, { prompt: 'Hello from iOS!' })}
      />
      {messages.map((m, i) => (
        <Text key={i}>{JSON.stringify(m.payload)}</Text>
      ))}
    </View>
  );
}
```

### Without context — standalone hooks

```tsx
import { useAxon, useMessages } from '@axonsdk/mobile';

function Screen() {
  const { client, connected, connect, error } = useAxon({
    provider: 'akash',
    secretKey: AXON_SECRET_KEY,
  });
  const messages = useMessages(client);

  return <Button title="Connect" onPress={connect} disabled={connected} />;
}
```

### Secure key storage

```tsx
import { SecureKeyStorage } from '@axonsdk/mobile';

const storage = new SecureKeyStorage();
await storage.saveSecretKey(myKey); // iOS Keychain / Android Keystore
const key = await storage.loadSecretKey();
```

### Mobile Router

Route across multiple DePIN endpoints from your React Native app with the same circuit-breaker and health-scoring logic as the server SDK:

```tsx
import { useAxonRouter } from '@axonsdk/mobile';

function App() {
  const { router, connected, health } = useAxonRouter({
    routes: [
      { provider: 'akash',   endpoint: 'https://lease.akash.example.com', secretKey },
      { provider: 'acurast', endpoint: 'wss://proxy.acurast.com',          secretKey },
    ],
    strategy: 'balanced',
    autoConnect: true,
  });

  return (
    <Button
      title="Send"
      onPress={() => router?.send({ prompt: 'Hello from iOS' })}
      disabled={!connected}
    />
  );
}
```

AppState listeners are attached automatically — the router pauses on background and resumes on foreground.

### Mobile API

| Export | Description |
|---|---|
| `MobileAxonClient` | Messaging-only client (no deploy/esbuild, works in Hermes/JSC) |
| `MobileAxonRouter` | Multi-provider router with circuit breakers and health scoring |
| `useAxon(options)` | Hook — manages client lifecycle, returns `{ client, connected, connect, disconnect, error }` |
| `useAxonRouter(config)` | Hook — manages router lifecycle, returns `{ router, connected, health, connect, disconnect }` |
| `useMessages(client)` | Hook — subscribes to messages, returns reactive `Message[]` array (newest first) |
| `useSend(client)` | Hook — wraps `client.send()` with `sending` / `sendError` state |
| `AxonProvider` | React context — provides client to the full component tree |
| `useAxonContext()` | Consumes the AxonProvider context |
| `SecureKeyStorage` | Persists keys via iOS Keychain / Android Keystore (`expo-secure-store`) |

**Supported providers in `@axonsdk/mobile`:** `'akash'` (HTTP), `'acurast'` (WebSocket), `'http'` (generic HTTPS)

> Deploy your processors with `axon deploy` on your development machine. The mobile SDK handles calling them — not deploying.

---

## Provider setup

### io.net

```bash
axon auth ionet
```

Requires an io.net API key. Get one at [cloud.io.net](https://cloud.io.net) → API Keys.

**Required `.env` keys:** `IONET_API_KEY`

**Optional `.env` keys:** `IONET_CLUSTER_ID` (leave blank to auto-select the cheapest available GPU cluster)

**How it works:**
1. Your TypeScript entry file is bundled with esbuild
2. The bundle is uploaded to IPFS — the CID is the deployment source of truth
3. A job is submitted to `api.io.net/v1/jobs` targeting the specified (or cheapest) GPU cluster
4. io.net provisions a worker with your bundle; the `workerEndpoint` becomes your processorId
5. Send messages via `client.send(processorId, payload)` — response size capped at 4 MiB, timeout 60s

**Estimated cost:** ~$0.40/hr per A100 GPU (spot), auto-calculated via `client.estimate()`

---

### Acurast

```bash
axon auth acurast
```

Requires a Polkadot-compatible wallet mnemonic (12 or 24 words) and an IPFS endpoint. Get a wallet at [console.acurast.com](https://console.acurast.com) and testnet tokens at [faucet.acurast.com](https://faucet.acurast.com).

**Required `.env` keys:** `ACURAST_MNEMONIC`, `ACURAST_IPFS_URL`, `ACURAST_IPFS_API_KEY`

---

### Fluence

```bash
axon auth fluence
```

Requires an EVM-compatible private key (hex). The wizard generates one automatically and prints the address so you can fund it.

**Required `.env` keys:** `FLUENCE_PRIVATE_KEY`, `FLUENCE_RELAY_ADDR`, `FLUENCE_NETWORK`

---

### Koii

```bash
axon auth koii
```

Requires a Solana-compatible keypair (base58). The wizard generates one automatically.

**Required `.env` keys:** `KOII_PRIVATE_KEY`, `KOII_IPFS_URL`, `KOII_NETWORK`

---

### Akash Network

```bash
axon auth akash
```

Requires a BIP-39 wallet mnemonic (12 or 24 words) and an IPFS endpoint. The wizard stores your mnemonic and configures the RPC node and chain ID automatically.

**Required `.env` keys:** `AKASH_MNEMONIC`, `AKASH_IPFS_URL`

**Optional `.env` keys:** `AKASH_IPFS_API_KEY`, `AKASH_NODE` (default: `https://rpc.akashnet.net:443`), `AKASH_CHAIN_ID` (default: `akashnet-2`), `AKASH_KEY_NAME` (default: `axon`)

**Prerequisite:** The `provider-services` CLI must be installed:
```bash
# Install Akash provider-services CLI
curl https://raw.githubusercontent.com/akash-network/provider/main/script/install.sh | bash
```
Docs: [docs.akash.network/guides/cli/akash-provider-services](https://docs.akash.network/guides/cli/akash-provider-services)

**How it works:**
1. Your TypeScript entry file is bundled with esbuild
2. The bundle is uploaded to IPFS — the CID is the immutable source of truth
3. An Akash SDL (Stack Definition Language) is generated with `node:20-alpine`, the CID embedded as `BUNDLE_CID`, and your env vars
4. `provider-services tx deployment create` submits the SDL to the Akash marketplace
5. A winning provider bids and spins up the container, which fetches the bundle from IPFS at startup and runs it

---

## Templates

| Template | Description |
|---|---|
| [`inference`](./templates/inference) | Confidential LLM inference — receive prompts, call an OpenAI-compatible API, return results privately inside a TEE |
| [`oracle`](./templates/oracle) | Data oracle — fetch external data on a schedule, sign it inside the TEE, push to on-chain destinations |
| `blank` | Empty project with full provider runtime type declarations |

---

## `axon.json` reference

```json
{
  "projectName": "my-edge-app",
  "provider": "akash",
  "runtime": "nodejs",
  "entryFile": "src/index.ts",
  "schedule": {
    "type": "on-demand",
    "durationMs": 86400000
  },
  "replicas": 1,
  "maxCostPerExecution": 10000,
  "environment": {
    "MY_VAR": "my-value"
  },
  "destinations": []
}
```

| Field | Type | Description |
|---|---|---|
| `projectName` | `string` | Human-readable project name |
| `provider` | `ionet \| akash \| acurast \| fluence \| koii` | Target compute provider |
| `runtime` | `nodejs \| python \| docker \| wasm` | Execution runtime |
| `entryFile` | `string` | Path to your script entry point |
| `schedule.type` | `on-demand \| interval \| onetime` | When the script runs |
| `schedule.intervalMs` | `number` | Milliseconds between runs (interval only) |
| `schedule.durationMs` | `number` | Total deployment lifetime in ms |
| `replicas` | `number` | Number of processor nodes / container replicas |
| `maxCostPerExecution` | `number` | Cost cap per run (in provider micro-units: uACU, uAKT, etc.) |
| `environment` | `object` | Key-value pairs injected into your script at bundle time |
| `destinations` | `string[]` | On-chain addresses to push results to |

---

## Project structure

```
axon/
├── packages/
│   ├── cli/          # @axonsdk/cli — command-line tool
│   ├── inference/    # @axonsdk/inference — OpenAI-compatible inference handler
│   └── sdk/          # @axonsdk/sdk — core library
│       └── src/
│           ├── providers/
│           │   ├── ionet/    # io.net GPU provider
│           │   ├── akash/    # Akash Network provider
│           │   ├── acurast/  # Acurast provider
│           │   ├── fluence/  # Fluence provider
│           │   └── koii/     # Koii provider
│           └── runtime/
│               └── adapters/ # Per-provider runtime bootstraps
├── status/
│   └── index.html    # Provider health dashboard (status.axonsdk.dev)
├── templates/
│   ├── inference/    # Confidential LLM inference
│   └── oracle/       # Data oracle
└── examples/
    └── nextjs-app/   # Example Next.js integration
```

---

## Development

```bash
# Clone
git clone https://github.com/deyzho/axonsdk.git
cd axon

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Watch mode during development
cd packages/sdk && npm run dev
```

### Running tests

```bash
cd packages/sdk
npx vitest run
```

135 tests covering config loading and validation, runtime bootstrap generation for all four providers, provider client construction and SSRF protection, cost estimation, message handler registration, SDL generation (Akash), disconnect lifecycle, mobile client SSRF/validation, and SecureKeyStorage.

---

## Security

Axon is designed to protect both developers and end users:

- **Secrets never leave `.env`** — the auth wizard generates keys locally and stores them with `chmod 600`. They are never logged or transmitted.
- **esbuild injection guard** — the deploy pipeline rejects any `environment` key that looks like a secret (`_KEY`, `_SECRET`, `_TOKEN`, `_MNEMONIC`, `_PASSWORD`) to prevent accidental bundle-time embedding of credentials.
- **SSRF protection** — all HTTP calls (IPFS upload, Akash lease endpoints, Koii task nodes) validate URLs against a private-IP blocklist and enforce HTTPS.
- **DNS rebinding defence** — the local mock runtime resolves hostnames to IPs via `dns.lookup()` before opening any TCP connection, then re-validates the resolved IP against the blocklist.
- **Prototype pollution prevention** — remote JSON payloads are parsed with key blocklisting (`__proto__`, `constructor`, `prototype`) and `axon.json` environment maps use `Object.create(null)`.
- **Response size caps** — all provider clients enforce a 1 MiB cap on remote responses; the mock runtime enforces a 4 MiB cap on HTTP bodies.
- **SDL path traversal guard** — Akash deploy validates that the entry file path cannot escape the project directory before bundling.

---

## Contributing

Pull requests are welcome. To get started:

1. Fork the repo and create a feature branch
2. Make your changes with tests
3. Run `npm test` and ensure all tests pass
4. Open a pull request with a clear description

High-impact areas:
- Integration tests against Acurast testnet and Akash sandbox
- Additional provider support (Bacalhau, Render Network)
- Template marketplace

---

## License

MIT — see [LICENSE](./LICENSE).

---

*Axon is not affiliated with io.net, Akash Network, Acurast, Fluence, or Koii. Provider names and trademarks belong to their respective owners.*
