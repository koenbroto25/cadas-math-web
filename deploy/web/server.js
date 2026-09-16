/**
 * server.js — Static file server untuk web build CADAS App.
 *
 * Dependency-free (hanya modul bawaan Node) agar Railway/Nixpacks tidak perlu
 * install apa pun selain Node. Fitur:
 *   - SPA fallback: request yang tidak menemukan file → index.html
 *   - MIME type lengkap untuk js/css/png/svg/json/ico/woff2
 *   - Cache-Control immutable untuk /_expo/static/* dan /assets/*
 *   - Health endpoint /healthz untuk Railway healthcheck
 *
 * File ini adalah TEMPLATE. Disalin otomatis ke dist/server.js oleh
 * scripts/build-web.js — JANGAN edit dist/server.js langsung.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '3000', 10);
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
};

function isImmutable(urlPath) {
  return urlPath.startsWith('/_expo/static/') || urlPath.startsWith('/assets/');
}

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch (e) {
    urlPath = '/';
  }

  // Healthcheck untuk Railway
  if (urlPath === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', service: 'cadas-web' }));
    return;
  }

  // Cegah path traversal
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      filePath = fs.existsSync(indexPath) ? indexPath : path.join(ROOT, 'index.html');
    } else if (!fs.existsSync(filePath)) {
      const dirIndex = path.join(filePath, 'index.html');
      // SPA fallback: route client-side (mis. /student) → index.html
      filePath = fs.existsSync(dirIndex) ? dirIndex : path.join(ROOT, 'index.html');
    }
  } catch (e) {
    filePath = path.join(ROOT, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const base = path.basename(filePath).toLowerCase();
    const isManifest = base === 'manifest.json' || ext === '.webmanifest';
    const headers = {
      'Content-Type': isManifest
        ? 'application/manifest+json; charset=utf-8'
        : (MIME[ext] || 'application/octet-stream'),
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
    headers['Cache-Control'] = isImmutable(urlPath)
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=0, must-revalidate';
    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[cadas-web] static server listening on 0.0.0.0:${PORT} (root: ${ROOT})`);
});
