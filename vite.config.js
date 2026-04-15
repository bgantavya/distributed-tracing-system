import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const readJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
};

const proxyMiddleware = async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/api/proxy') {
    return false;
  }

  try {
    const payload = await readJsonBody(req);
    const baseUrl = String(payload.baseUrl || '').trim();
    const method = String(payload.method || 'GET').toUpperCase();
    const path = String(payload.path || '/').trim();
    const body = payload.body;

    if (!baseUrl) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'baseUrl is required' }));
      return true;
    }

    let parsedBase;
    try {
      parsedBase = new URL(baseUrl);
    } catch {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid baseUrl' }));
      return true;
    }

    const targetUrl = `${parsedBase.origin}${path.startsWith('/') ? path : `/${path}`}`;
    const canHaveBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    const upstream = await fetch(targetUrl, {
      method,
      headers: {
        'content-type': 'application/json',
      },
      body: canHaveBody && body !== undefined ? JSON.stringify(body) : undefined,
    });

    const contentType = upstream.headers.get('content-type') || '';
    const responseBody = contentType.includes('application/json') ? await upstream.json() : await upstream.text();

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        status: upstream.status,
        statusText: upstream.statusText,
        traceId: upstream.headers.get('x-trace-id'),
        body: responseBody,
      }),
    );
    return true;
  } catch (error) {
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'Proxy request failed',
        details: error instanceof Error ? error.message : String(error),
      }),
    );
    return true;
  }
};

const dtsProxyPlugin = () => ({
  name: 'dts-proxy-plugin',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const handled = await proxyMiddleware(req, res);
      if (!handled) next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const handled = await proxyMiddleware(req, res);
      if (!handled) next();
    });
  },
});

export default defineConfig({
  base: "/",
  plugins: [react(), dtsProxyPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
});