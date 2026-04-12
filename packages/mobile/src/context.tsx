/**
 * AxonProvider — React context for app-wide Axon client management.
 *
 * Wrap your root component with AxonProvider to make the client available
 * anywhere in the tree via useAxonContext().
 *
 * Example:
 *
 *   // App.tsx
 *   export default function App() {
 *     return (
 *       <AxonProvider
 *         provider="akash"
 *         secretKey={AXON_SECRET_KEY}
 *         autoConnect
 *       >
 *         <NavigationContainer>...</NavigationContainer>
 *       </AxonProvider>
 *     );
 *   }
 *
 *   // AnyScreen.tsx
 *   function AnyScreen() {
 *     const { client, connected } = useAxonContext();
 *     const messages = useMessages(client);
 *     ...
 *   }
 */

import { createContext, useContext } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import { useAxon } from './hooks.js';
import type { UseAxonOptions, UseAxonResult } from './hooks.js';

// ─── Context ─────────────────────────────────────────────────────────────────

const AxonContext = createContext<UseAxonResult | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export type AxonProviderProps = PropsWithChildren<UseAxonOptions>;

/**
 * Provides a MobileAxonClient to the entire React tree.
 * The client is created once and shared across all consumers.
 */
export function AxonProvider({ children, ...options }: AxonProviderProps): ReactNode {
  const axon = useAxon(options);
  // @types/react 18.3 changed ComponentType's return to ReactElement | null
  // which no longer satisfies JSX ReactNode. Cast to suppress the false positive;
  // runtime behaviour is correct.
  const Provider = AxonContext.Provider as (p: {
    value: UseAxonResult | null;
    children?: ReactNode;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) => any;
  return (
    <Provider value={axon}>
      {children}
    </Provider>
  );
}

// ─── Consumer hook ────────────────────────────────────────────────────────────

/**
 * Access the Axon client from any component inside an AxonProvider.
 * Throws if called outside of an AxonProvider tree.
 */
export function useAxonContext(): UseAxonResult {
  const ctx = useContext(AxonContext);
  if (!ctx) {
    throw new Error(
      'useAxonContext() must be called inside a <AxonProvider>. ' +
        'Wrap your root component with <AxonProvider provider="akash" secretKey={...}>.'
    );
  }
  return ctx;
}
