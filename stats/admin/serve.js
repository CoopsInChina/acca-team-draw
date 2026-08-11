#!/usr/bin/env node
/* ============================================================================
   ACCA DATA EDITOR — local helper server (zero dependencies)
   ----------------------------------------------------------------------------
   Serves the week-entry UI and lets it write stats/data.js directly.

   RUN IT:
     node stats/admin/serve.js
   then open the printed URL (http://localhost:4599/stats/admin/).

   Every save writes stats/data.js and keeps the previous version as
   stats/data.js.bak. Local only — nothing is exposed to the internet.
   ============================================================================ */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');           // team-draw/
const DATA = path.join(ROOT, 'stats', 'data.js');           // the file we edit
const PORT = process.env.PORT || 4599;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};

const server = http.createServer((req, res) => {
  // ---- Save endpoint: overwrite stats/data.js -----------------------------
  if (req.method === 'POST' && req.url === '/api/save-data') {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => {
      try {
        if (typeof body !== 'string' || body.indexOf('window.ACCA_DATA') === -1)
          throw new Error('Payload does not look like a data.js file');
        if (fs.existsSync(DATA)) fs.copyFileSync(DATA, DATA + '.bak');
        fs.writeFileSync(DATA, body, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, bytes: Buffer.byteLength(body), backup: 'stats/data.js.bak' }));
        console.log(`  ✔ saved stats/data.js (${Buffer.byteLength(body)} bytes)`);
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e.message || e) }));
        console.log(`  ✘ save failed: ${e.message || e}`);
      }
    });
    return;
  }

  // ---- Monkey Magic: generate this week's banker picks --------------------
  if (req.method === 'GET' && req.url.split('?')[0] === '/api/monkey') {
    const params = new URLSearchParams((req.url.split('?')[1] || ''));
    const opts = { seed: params.get('seed') || undefined, mock: params.get('mock') === '1' };
    require('./monkey.js').generate(opts)
      .then(result => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        console.log(`  🐒 monkey: ${result.poolSize} bankers, picked ${result.picks.length} (seed ${result.seed})`);
      })
      .catch(e => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e.message || e) }));
        console.log(`  ✘ monkey failed: ${e.message || e}`);
      });
    return;
  }

  // ---- Static file serving (from repo root) -------------------------------
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/') urlPath = '/stats/admin/';
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found: ' + urlPath); return; }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',   // always serve fresh data.js after a save
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`
  ⚽  Acca data editor is running
  →  http://localhost:${PORT}/stats/admin/

  Edits are written to stats/data.js (previous version kept as data.js.bak).
  Press Ctrl+C to stop.
`);
});
