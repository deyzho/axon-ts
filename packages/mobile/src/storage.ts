/**
 * SecureKeyStorage — persists the Axon secret key securely on-device.
 *
 * On iOS, expo-secure-store uses the Keychain Services API.
 * On Android, it uses the Android Keystore system.
 *
 * If expo-secure-store is not available (e.g. bare RN without Expo, or test
 * environments), the values are kept in an in-memory Map for the session.
 * In that case, keys are not persisted across app restarts — the user must
 * call saveSecretKey() on every launch.
 *
 * Usage:
 *   const storage = new SecureKeyStorage();
 *   await storage.saveSecretKey('0xabc...');
 *   const key = await storage.loadSecretKey(); // '0xabc...'
 */

const AXON_KEY_NAME = 'axon_secret_key';

export class SecureKeyStorage {
  private memoryFallback: Map<string, string> = new Map();
  private usingSecureStore = false;

  /**
   * Attempt to detect expo-secure-store availability.
   * Called lazily on first access.
   */
  private async getSecureStore(): Promise<typeof import('expo-secure-store') | null> {
    try {
      const store = await import('expo-secure-store');
      this.usingSecureStore = true;
      return store;
    } catch {
      this.usingSecureStore = false;
      return null;
    }
  }

  /**
   * Save the Axon secret key to secure storage.
   * On iOS: Keychain. On Android: Keystore. Fallback: in-memory.
   */
  async saveSecretKey(value: string): Promise<void> {
    const store = await this.getSecureStore();
    if (store) {
      await store.setItemAsync(AXON_KEY_NAME, value);
    } else {
      this.memoryFallback.set(AXON_KEY_NAME, value);
    }
  }

  /**
   * Load the Axon secret key from secure storage.
   * Returns null if no key has been saved.
   */
  async loadSecretKey(): Promise<string | null> {
    const store = await this.getSecureStore();
    if (store) {
      return store.getItemAsync(AXON_KEY_NAME);
    }
    return this.memoryFallback.get(AXON_KEY_NAME) ?? null;
  }

  /**
   * Delete the Axon secret key from secure storage.
   * Use this for sign-out / key rotation flows.
   */
  async deleteSecretKey(): Promise<void> {
    const store = await this.getSecureStore();
    if (store) {
      await store.deleteItemAsync(AXON_KEY_NAME);
    } else {
      this.memoryFallback.delete(AXON_KEY_NAME);
    }
  }

  /**
   * Whether expo-secure-store was successfully loaded on the last access.
   * False means keys are only stored in memory for this session.
   */
  get isHardwareBacked(): boolean {
    return this.usingSecureStore;
  }

  // ─── Generic key/value helpers ───────────────────────────────────────────────
  // For storing additional per-provider credentials (e.g. AKASH_NODE)

  async save(key: string, value: string): Promise<void> {
    const store = await this.getSecureStore();
    if (store) {
      await store.setItemAsync(`axon_${key}`, value);
    } else {
      this.memoryFallback.set(`axon_${key}`, value);
    }
  }

  async load(key: string): Promise<string | null> {
    const store = await this.getSecureStore();
    if (store) {
      return store.getItemAsync(`axon_${key}`);
    }
    return this.memoryFallback.get(`axon_${key}`) ?? null;
  }

  async delete(key: string): Promise<void> {
    const store = await this.getSecureStore();
    if (store) {
      await store.deleteItemAsync(`axon_${key}`);
    } else {
      this.memoryFallback.delete(`axon_${key}`);
    }
  }
}
