# @phonix/mobile

React Native / Expo SDK for calling Phonix edge processors from iOS and Android apps.

Deploy your processors once with the [Phonix CLI](../cli/) — then call them from any iOS or Android app using this package.

## Install

```bash
npm install @phonix/mobile
```

**Peer dependencies** (already in your Expo / React Native project):
```bash
npm install react react-native
```

**Optional — hardware-backed key storage:**
```bash
npx expo install expo-secure-store
```

---

## Quick start

### 1. Wrap your root component

```tsx
// App.tsx
import { PhonixProvider } from '@phonix/mobile';

export default function App() {
  return (
    <PhonixProvider
      provider="akash"
      secretKey={PHONIX_SECRET_KEY}
      autoConnect
    >
      <NavigationContainer>
        <MainStack />
      </NavigationContainer>
    </PhonixProvider>
  );
}
```

### 2. Use hooks in any screen

```tsx
// screens/InferenceScreen.tsx
import { usePhonixContext, useMessages, useSend } from '@phonix/mobile';

export function InferenceScreen() {
  const { client, connected, connect } = usePhonixContext();
  const messages = useMessages(client);
  const { send, sending } = useSend(client);

  return (
    <View>
      <Text>{connected ? '🟢 Connected' : '⚪ Offline'}</Text>

      <Button
        title={sending ? 'Sending...' : 'Run inference'}
        disabled={!connected || sending}
        onPress={() =>
          send(AKASH_LEASE_URL, {
            requestId: crypto.randomUUID(),
            prompt: 'Summarize the latest news',
          })
        }
      />

      {messages.map((msg, i) => (
        <Text key={i}>{JSON.stringify(msg.payload)}</Text>
      ))}
    </View>
  );
}
```

---

## Without context

If you only need messaging in a single screen, use `usePhonix` directly:

```tsx
import { usePhonix, useMessages, useSend } from '@phonix/mobile';

export function Screen() {
  const { client, connected, connect, error } = usePhonix({
    provider: 'akash',
    secretKey: PHONIX_SECRET_KEY,
  });
  const messages = useMessages(client);
  const { send } = useSend(client);

  return (
    <View>
      <Button title="Connect" onPress={connect} disabled={connected} />
      {error && <Text style={{ color: 'red' }}>{error.message}</Text>}
      {messages.map((m, i) => <Text key={i}>{JSON.stringify(m.payload)}</Text>)}
    </View>
  );
}
```

---

## Secure key storage

The `SecureKeyStorage` class persists your secret key using the platform's hardware-backed store:

| Platform | Storage |
|---|---|
| iOS | Keychain Services |
| Android | Android Keystore |
| No `expo-secure-store` | In-memory (session only) |

```typescript
import { SecureKeyStorage } from '@phonix/mobile';

const storage = new SecureKeyStorage();

// On first launch / after auth
await storage.saveSecretKey(mySecretKey);

// On every launch — restore the key
const key = await storage.loadSecretKey();
if (key) {
  // initialise PhonixProvider with `secretKey={key}`
}

// On sign-out / key rotation
await storage.deleteSecretKey();
```

---

## AppState lifecycle

The client automatically disconnects when your app moves to the background and reconnects when it returns to the foreground. This happens automatically when using `usePhonix` or `PhonixProvider`.

To opt out, set `reconnectOnForeground: false`:

```tsx
<PhonixProvider
  provider="akash"
  secretKey={key}
  reconnectOnForeground={false}
>
```

---

## Supported providers

| Provider | Transport | Deploy with |
|---|---|---|
| `'akash'` | HTTP POST to lease endpoint | `phonix auth akash && phonix deploy` |
| `'acurast'` | WebSocket to Acurast proxy | `phonix auth acurast && phonix deploy` |
| `'http'` | Generic HTTPS POST | Any HTTPS server |

> `@phonix/mobile` handles **calling** processors, not deploying them. Use the [Phonix CLI](../cli/) on your development machine to deploy.

---

## API reference

### `MobilePhonixClient`

```typescript
const client = new MobilePhonixClient({
  provider: 'akash' | 'acurast' | 'http',
  secretKey: string,
  wsUrl?: string,             // Acurast WebSocket URL (default: wss://proxy.acurast.com)
  reconnectOnForeground?: boolean,  // default: true
  maxResponseBytes?: number,  // default: 1 MiB
});

await client.connect();
await client.send(endpoint, payload);
client.onMessage(handler);  // returns unsubscribe fn
await client.isLive(leaseUrl);  // Akash health probe
client.disconnect();
client.dispose();           // disconnect + remove AppState listener + clear handlers
```

### `usePhonix(options)`

```typescript
const {
  client,       // MobilePhonixClient | null
  connected,    // boolean
  connecting,   // boolean
  error,        // Error | null
  connect,      // () => Promise<void>
  disconnect,   // () => void
} = usePhonix({ provider, secretKey, autoConnect?, ...});
```

### `useMessages(client, options?)`

```typescript
const messages = useMessages(client, {
  maxMessages?: number,        // default: 50
  trustedSenders?: string[],   // filter by processor ID
});
// returns Message[] — newest first
```

### `useSend(client)`

```typescript
const { send, sending, sendError } = useSend(client);
await send(endpoint, payload);
```

### `PhonixProvider` / `usePhonixContext()`

```tsx
<PhonixProvider provider="akash" secretKey={key} autoConnect>
  {children}
</PhonixProvider>

// In any child:
const { client, connected, connect, disconnect, error } = usePhonixContext();
```

---

## Security

- **SSRF protection** — all endpoints must be `https://` or `wss://`; private IPs (`192.168.x.x`, `10.x.x.x`, `127.x.x.x`, etc.) are blocked
- **Response size cap** — responses over 1 MiB are rejected (configurable via `maxResponseBytes`)
- **Prototype pollution prevention** — remote JSON payloads are checked for `__proto__`, `constructor`, and `prototype` keys

---

## License

MIT
