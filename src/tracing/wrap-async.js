import { AsyncLocalStorage } from './async-context.js';

export function wrapAsync(fn) {
  return function(...args) {
    const context = AsyncLocalStorage.getStore();
    return AsyncLocalStorage.run(context, () => fn.apply(this, args));
  };
}

export function withTraceContext(context, fn) {
  return AsyncLocalStorage.run(context, fn);
}
