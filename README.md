# dts-tracer &middot; ![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg) [![npm version](https://img.shields.io/npm/v/dts-tracer.svg?style=flat)](https://www.npmjs.com/package/dts-tracer) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)


Minimal tracing middleware for Express.

Captures request traces based on policy rules (slow requests and/or status code class), exposes in-memory logs, and lets you persist logs via callback.

## Install

```bash
npm install dts-tracer
```

## Basic Usage

```ts
import express from "express";
import { createTraceRequest, getTraceLogs } from "dts-tracer";

const app = express();

app.use(createTraceRequest());

app.get("/logs", (_req, res) => {
  res.json(getTraceLogs());
});

app.listen(3000);
```

## Create your own policy (inline)

Use a custom policy object when your app needs different thresholds.

```ts
import express from "express";
import { createTraceRequest } from "dts-tracer";

const app = express();

app.use(
	createTraceRequest({
		policy: {
			captureSlow: 300,
			captureCodes: [4, 5]
		},
		onTrace: (trace) => {
			console.log(trace); // persist to DB/file here
		}
	})
);
```

## Create your own policy (from file)

```ts
import policy from "./my-tracing-policy.json" assert { type: "json" };
import { createTraceRequest } from "dts-tracer";

app.use(createTraceRequest({ policy }));
```

Example `my-tracing-policy.json`:

```json
{
	"captureSlow": 250,
	"captureCodes": [4, 5]
}
```

## API

- `createTraceRequest(options)`: create middleware with custom options.
- `getTraceLogs()`: get a copy of in-memory logs.
- `clearTraceLogs()`: clear in-memory logs.
- `getDefaultTracePolicy()`: get package default policy.

### Options

- `onTrace?: (trace) => void`
- `saveToMemory?: boolean` (default: `true`)
- `maxLogs?: number` (default: `1000`)
- `policy?: { captureSlow?: number; captureCodes?: number[] }`

### Trace object
        
Each trace includes:

- `id`, `method`, `path`, `statusCode`, `startTime`, `durationMs`
- optional `ip`, `userAgent`, `userId`

## Policy meaning

- `captureSlow`: capture request if duration is greater than this value (ms)
- `captureCodes`: capture request if response status class matches (`1` for 1xx, `2` for 2xx, ... `5` for 5xx)

## License

MIT
