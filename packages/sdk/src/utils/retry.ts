/**
 * Exponential backoff retry utility.
 */

export interface RetryOptions {
  maxAttempts?: number;   // default 3
  baseDelayMs?: number;   // default 1000
  /** Return true if the error is retryable. Default: always retry. */
  shouldRetry?: (err: unknown, attempt: number) => boolean;
}

/**
 * Execute fn with exponential backoff. Delays: 1s, 2s, 4s (with ±20% jitter).
 * Throws the last error if all attempts fail.
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 1000;
  const shouldRetry = opts.shouldRetry ?? (() => true);

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts || !shouldRetry(err, attempt)) {
        throw err;
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1) * (0.8 + Math.random() * 0.4);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
