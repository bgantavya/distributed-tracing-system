import { async_hooks } from 'async_hooks';

export class AsyncLocalStorage {
  constructor() {
    this.store = new Map();
    this.asyncHook = async_hooks.createHook({
      init(asyncId, type, triggerAsyncId) {
        const parentContext = AsyncLocalStorage.store.get(triggerAsyncId);
        if (parentContext) {
          AsyncLocalStorage.store.set(asyncId, parentContext);
        }
      },
      before(asyncId) {
        const context = AsyncLocalStorage.store.get(asyncId);
        if (context) {
          AsyncLocalStorage.currentContext = context;
        }
      },
      after(asyncId) {
        AsyncLocalStorage.currentContext = null;
      },
      destroy(asyncId) {
        AsyncLocalStorage.store.delete(asyncId);
      }
    });
  }

  static store = new Map();
  static currentContext = null;

  get() {
    return AsyncLocalStorage.currentContext;
  }

  run(store, fn, ...args) {
    const asyncId = async_hooks.executionAsyncId();
    AsyncLocalStorage.store.set(asyncId, store);
    try {
      return fn(...args);
    } finally {
      AsyncLocalStorage.store.delete(asyncId);
    }
  }

  getStore() {
    return AsyncLocalStorage.currentContext;
  }
}
