/**
 * IAxonRuntime — provider-agnostic runtime interface for deployment scripts.
 *
 * Templates use `axon.http.GET(...)` and `axon.ws.open(...)` instead of
 * provider-specific globals like `_STD_`. At bundle time, the deployer prepends
 * a runtime bootstrap that maps `axon` to the correct provider API.
 */

export interface AxonRuntimeHttp {
  /**
   * Make an HTTP GET request.
   * @param url       - The URL to fetch
   * @param headers   - Request headers
   * @param callback  - Called with the response body as a string
   */
  GET(
    url: string,
    headers: Record<string, string>,
    callback: (response: string) => void
  ): void;

  /**
   * Make an HTTP POST request.
   * @param url       - The URL to post to
   * @param headers   - Request headers (include Content-Type)
   * @param body      - Request body string
   * @param callback  - Called with the response body as a string
   */
  POST(
    url: string,
    headers: Record<string, string>,
    body: string,
    callback: (response: string) => void
  ): void;
}

export interface AxonRuntimeWs {
  /**
   * Open a WebSocket connection.
   * @param url       - WebSocket URL (wss://)
   * @param options   - Provider-specific options (headers, etc.)
   * @param onOpen    - Called when connection is established
   * @param onMessage - Called for each incoming message
   * @param onError   - Called on connection errors
   */
  open(
    url: string,
    options: Record<string, unknown>,
    onOpen: () => void,
    onMessage: (payload: string) => void,
    onError: (err: unknown) => void
  ): void;

  /** Send a message over the open WebSocket connection. */
  send(payload: string): void;

  /** Close the WebSocket connection. */
  close(): void;
}

/**
 * The complete Axon runtime interface available to deployment scripts via
 * the `axon` global.
 */
export interface IAxonRuntime {
  /** The name of the provider this runtime is running on. */
  readonly providerName: string;

  /** HTTP primitives for making outbound requests from the deployment script. */
  http: AxonRuntimeHttp;

  /** WebSocket primitives for bidirectional messaging with your dApp. */
  ws: AxonRuntimeWs;

  /**
   * Fulfill the current job with a result (on-chain push).
   * Used in oracle-style deployments to write results to chain destinations.
   */
  fulfill?(
    result: string,
    contentType: string,
    destinations: Record<string, unknown>,
    onSuccess: () => void,
    onError: (err: unknown) => void
  ): void;
}
