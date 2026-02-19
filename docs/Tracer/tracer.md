# Tracer

## Description

This module provides middleware for Express.js applications to trace incoming requests. It generates a unique `traceId` for each request, attaches it to the request and response objects, and logs request details (method, path, status code, timing) upon response completion.

## How to Use

1.  **Install Dependencies:**
    Ensure you have Node.js and npm/yarn installed. Install necessary packages if not already present.

2.  **Integrate Middleware:**
    Import the `traceRequest` middleware and use it in your Express application setup before your route handlers.

    ```javascript
    import express from 'express';
    import { traceRequest } from './tracer'; // Adjust path as needed

    const app = express();

    // Use the tracing middleware
    app.use(traceRequest);

    // Your routes
    app.get('/', (req, res) => {
      res.send('Hello World!');
    });

    const port = 3000;
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
    ```

3.  **Access Trace ID:**
    The `traceId` will be available on `req.traceId`. The `X-Trace-Id` header will be sent in the response.

## Architecture or Code Overview

The `traceRequest` middleware functions as an Express.js middleware.

*   **`traceRequest(req, res, next)`:**
    *   Generates a UUID for `traceId`.
    *   Records the `startTime` of the request.
    *   Attaches `traceId` and `startTime` to the `req` object.
    *   Sets the `X-Trace-Id` response header.
    *   Attaches a listener to the `res.on("finish", ...)` event.
        *   When the response finishes, it calculates the `durationMs`.
        *   It calls `addTrace` (imported from `../Tracer/store`) to log the request details.
    *   Calls `next()` to pass control to the next middleware/route handler.
