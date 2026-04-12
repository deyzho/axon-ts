// Type shims for packages that lack bundled declarations under TypeScript 6
declare module 'inquirer' {
  const inquirer: {
    prompt<T = Record<string, unknown>>(questions: unknown[]): Promise<T>;
  };
  export = inquirer;
}

declare module 'update-notifier' {
  interface Notifier {
    notify(): void;
    update?: { latest: string };
  }
  function updateNotifier(opts: { pkg: { name: string; version: string }; [key: string]: unknown }): Notifier;
  export = updateNotifier;
}
