# Trace Store

## Description

This module provides a simple in-memory store for `Trace` objects. It allows adding, retrieving, and clearing traces. Traces are only logged to the console in development environments.

### Usage

```typescript
import { addTrace, getTraces, clearTraces } from './store';
import type { Trace } from './utils/types'; 

const myTrace: Trace = { /* ... trace properties ... */ };

// Add a trace
addTrace(myTrace);

// Get all traces
const allTraces = getTraces();

// Clear all traces
clearTraces();
```
## Architecture or Code Overview

The `store.ts` file defines a simple in-memory array `traces` to hold `Trace` objects.

-   `getTraces()`: Returns a shallow copy of the `traces` array.
-   `clearTraces()`: Resets the `traces` array to be empty.
-   `addTrace(trace: Trace)`: Adds a `Trace` object to the `traces` array. If `process.env.NODE_ENV` is not equal to `ServeTypes.Dev`, it logs the trace to the console.
