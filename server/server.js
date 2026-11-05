/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// Serves the built Angular bundle from the container: static files, a
// runtime-rendered assets/env.js, GET /health and JSON logs on stdout/stderr.
// Uses only Node built-ins and never writes to the filesystem.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.pdf': 'application/pdf',
  '.wasm': 'application/wasm'
};

function log(level, msg, fields = {}) {
  const line = JSON.stringify({ time: new Date().toISOString(), level, msg, ...fields });
  (level === 'error' ? process.stderr : process.stdout).write(line + '\n');
}

// Same substitution envsubst did in the nginx image: $VAR and ${VAR} become
// the variable's value, or an empty string when it is unset.
function renderEnvTemplate(template, env) {
  return template.replace(/\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))/g, (_, braced, bare) => {
    const value = env[braced || bare];
    return value === undefined ? '' : value;
  });
}

function createApp({ root, env = process.env } = {}) {
  const rootDir = path.resolve(root);
  const templatePath = path.join(rootDir, 'assets', 'env.template.js');
  const envJs = fs.existsSync(templatePath) ? renderEnvTemplate(fs.readFileSync(templatePath, 'utf8'), env) : null;

  function resolveFile(urlPath) {
    let decoded;
    try {
      decoded = decodeURIComponent(urlPath);
    } catch {
      return null;
    }
    if (decoded.includes('\0')) return null;
    const candidate = path.resolve(rootDir, '.' + path.posix.normalize('/' + decoded));
    if (candidate !== rootDir && !candidate.startsWith(rootDir + path.sep)) return null;
    try {
      const stat = fs.statSync(candidate);
      if (stat.isDirectory()) {
        const index = path.join(candidate, 'index.html');
        return fs.statSync(index).isFile() ? index : null;
      }
      return stat.isFile() ? candidate : null;
    } catch {
      return null;
    }
  }

  function writeHead(res, status, headers) {
    res.statusCode = status;
    for (const [
      name,
      value
    ] of Object.entries({ 'X-Content-Type-Options': 'nosniff', ...headers })) {
      res.setHeader(name, value);
    }
  }

  function send(req, res, status, headers, body) {
    writeHead(res, status, { 'Content-Length': Buffer.byteLength(body), ...headers });
    res.end(req.method === 'HEAD' ? undefined : body);
  }

  function handle(req, res) {
    const urlPath = (req.url || '/').split('?')[0].split('#')[0];

    if (urlPath === '/health') {
      return send(
        req,
        res,
        200,
        { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        '{"status":"UP"}'
      );
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return send(req, res, 405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain' }, 'Method Not Allowed');
    }
    if (urlPath === '/assets/env.js' && envJs !== null) {
      return send(req, res, 200, { 'Content-Type': MIME_TYPES['.js'], 'Cache-Control': 'no-cache' }, envJs);
    }

    const file = resolveFile(urlPath);
    if (!file) {
      return send(req, res, 404, { 'Content-Type': 'text/plain' }, 'Not Found');
    }
    const stat = fs.statSync(file);
    const ext = path.extname(file).toLowerCase();
    const headers = {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Last-Modified': stat.mtime.toUTCString(),
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    };
    writeHead(res, 200, headers);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file)
      .on('error', (err) => {
        log('error', 'read failed', { path: urlPath, error: err.message });
        res.destroy(err);
      })
      .pipe(res);
  }

  return http.createServer((req, res) => {
    const started = process.hrtime.bigint();
    res.on('finish', () => {
      log('info', 'request', {
        method: req.method,
        path: (req.url || '/').split('?')[0],
        status: res.statusCode,
        bytes: Number(res.getHeader('Content-Length')) || 0,
        duration_ms: Number(process.hrtime.bigint() - started) / 1e6,
        remote: req.socket.remoteAddress,
        user_agent: req.headers['user-agent'] || ''
      });
    });
    try {
      handle(req, res);
    } catch (err) {
      log('error', 'request failed', { path: req.url, error: err.message });
      if (!res.headersSent) send(req, res, 500, { 'Content-Type': 'text/plain' }, 'Internal Server Error');
      else res.destroy(err);
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8080);
  const root = process.env.STATIC_ROOT || path.join(__dirname, 'public');
  const server = createApp({ root });
  server.listen(port, () => log('info', 'listening', { port, root }));
  const shutdown = (signal) => {
    log('info', 'shutting down', { signal });
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    log('error', 'uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });
}

module.exports = { createApp, renderEnvTemplate };
