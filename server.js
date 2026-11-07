/**
 * ScoutAI 2.0 — Production Zero-Config Node.js Backend Proxy & Static Server
 * Serves active root interface (index.html, style.css, app.js) and securely proxies Gemini calls.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env if present
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}
loadEnv();

const PORT = parseInt(process.env.PORT || '3000', 10);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

// Security: Maximum request body size (10 MB)
const MAX_BODY_BYTES = 10 * 1024 * 1024;

// Security: Whitelist of allowed Gemini models
const ALLOWED_MODELS = new Set([
  'gemini-3.8-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-3.1-pro-preview',
  'gemini-2.0-flash',
]);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// Security: Files and patterns strictly prohibited from static delivery
const FORBIDDEN_FILE_PATTERNS = [
  /^\./,                       // Any dotfile (.env, .git, .mise.toml, etc.)
  /\/\./,                      // Hidden directories or dotfiles in path
  /\.env(\..+)?$/i,            // Any environment variable file
  /^(package|package-lock|pnpm-lock)\.(json|yaml)$/i,
  /^server\.js$/i,             // Server source
  /^(vite|vitest|tsconfig)\.(config\.)?[jt]s(on)?$/i,
  /\.(ts|tsx|map|yml|yaml|ini|log|zip|tar|gz)$/i,
];

function isPathForbidden(pathname) {
  const normalized = pathname.replace(/\\/g, '/');
  const baseName = path.basename(normalized);
  
  // Reject dotfiles and dot-directories
  if (normalized.split('/').some(part => part.startsWith('.'))) {
    return true;
  }
  
  return FORBIDDEN_FILE_PATTERNS.some(regex => regex.test(baseName) || regex.test(normalized));
}

const server = http.createServer(async (req, res) => {
  const host = req.headers.host || 'localhost';
  const origin = req.headers.origin;

  // Security: Restrict allowed CORS origins to localhost, local dev server, and scot.ai domains
  const isAllowedOrigin = !origin ||
    origin === `http://${host}` ||
    origin === `https://${host}` ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
    origin.endsWith('.scot.ai');

  if (origin && isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', `http://${host}`);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'null');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(isAllowedOrigin ? 204 : 403);
    res.end();
    return;
  }

  // Block unauthorized cross-origin requests targeting the AI proxy
  if (origin && !isAllowedOrigin && req.url.startsWith('/api/')) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'Cross-origin request forbidden' } }));
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(reqUrl.pathname);

  // ── Route: /api/gemini/health ───────────────────────
  if (pathname === '/api/gemini/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      hasKey: Boolean(GEMINI_API_KEY),
      activeModel: 'gemini-2.5-flash',
      proxyMode: 'server-side-gemini',
    }));
    return;
  }

  // ── Route: /api/gemini (POST Proxy) ─────────────────
  if (pathname === '/api/gemini' && req.method === 'POST') {
    if (!GEMINI_API_KEY) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'Server-side GEMINI_API_KEY is not configured in .env' } }));
      return;
    }

    let rawBody = '';
    let bodyBytes = 0;
    let isTooLarge = false;

    req.on('data', chunk => {
      if (isTooLarge) return;
      bodyBytes += chunk.length;
      if (bodyBytes > MAX_BODY_BYTES) {
        isTooLarge = true;
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Payload Too Large: maximum request body is 10MB' } }));
        req.destroy();
        return;
      }
      rawBody += chunk;
    });

    req.on('end', async () => {
      if (isTooLarge) return;
      try {
        const parsed = JSON.parse(rawBody || '{}');
        const requestedModel = parsed.model || 'gemini-2.5-flash';
        
        // Security: Validate model against allowed whitelist
        const model = ALLOWED_MODELS.has(requestedModel) ? requestedModel : 'gemini-2.5-flash';
        const payload = parsed.body || parsed;

        const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${GEMINI_API_KEY}`;
        const fetchRes = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await fetchRes.json().catch(() => ({}));
        res.writeHead(fetchRes.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: err.message || 'Internal proxy error' } }));
      }
    });
    return;
  }

  // ── Static File Serving with Security Controls ─────
  // Security check: Block secret files (.env, server source, dotfiles)
  if (isPathForbidden(pathname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden: Access to requested resource is prohibited.');
    return;
  }

  // Determine static root: dist/ if exists, otherwise project root
  const distDir = path.join(__dirname, 'dist');
  const hasDist = fs.existsSync(distDir);
  const staticRoot = hasDist ? distDir : __dirname;

  const safeRelPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const resolvedPath = path.resolve(staticRoot, safeRelPath);

  // Security check: Prevent path traversal outside static root
  if (!resolvedPath.startsWith(path.resolve(staticRoot))) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(resolvedPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback: try index.html for SPA routes or return 404
      const fallback = path.join(staticRoot, 'index.html');
      if (fs.existsSync(fallback)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(fallback).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
      return;
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(resolvedPath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[ScoutAI 2.0] Active Server listening on http://localhost:${PORT}`);
  console.log(`[ScoutAI 2.0] Proxy endpoint live: POST http://localhost:${PORT}/api/gemini`);
  console.log(`[ScoutAI 2.0] Server-side GEMINI_API_KEY: ${GEMINI_API_KEY ? 'Present' : 'Not Set'}`);
});
