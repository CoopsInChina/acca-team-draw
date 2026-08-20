#!/usr/bin/env node
/* ============================================================================
   ACCA DATA EDITOR — local helper server (zero dependencies)
   ----------------------------------------------------------------------------
   Serves the week-entry UI and lets it write stats/data.js directly.

   RUN IT:
     node stats/admin/serve.js
   then open the printed URL (http://localhost:4599/stats/admin/).

   Every save writes stats/data.js and keeps the previous version as
   stats/data.js.bak. Bound to 127.0.0.1 only — never reachable from other
   devices on the network, even though it can push to GitHub on your behalf.

   The editor's "Publish" button hits POST /api/publish, which runs
   git add + commit + push on stats/data.js only (nothing else in the repo).
   GitHub Pages rebuilds automatically once the push lands — no separate
   trigger needed.
   ============================================================================ */

const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const { execFile } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');           // team-draw/
const DATA = path.join(ROOT, 'stats', 'data.js');           // the file we edit
const PORT = process.env.PORT || 4599;

// Run one git command as an argument array (never a shell string) so nothing
// in a commit message or file path can be interpreted as shell syntax.
// Resolves with { ok, stdout, stderr } even on a non-zero exit — callers that
// need to tolerate specific failures (e.g. "nothing to commit") inspect that
// instead of catching a generic rejection.
function git(args) {
  return new Promise((resolve) => {
    execFile('git', args, { cwd: ROOT }, (err, stdout, stderr) => {
      resolve({ ok: !err, stdout: (stdout || '').trim(), stderr: (stderr || '').trim(), code: err ? err.code : 0 });
    });
  });
}

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

  // ---- Publish: commit + push stats/data.js so the live site updates ------
  // Pages rebuilds automatically on GitHub's side within a push — there is no
  // separate "trigger a rebuild" step needed once the push lands.
  if (req.method === 'POST' && req.url === '/api/publish') {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', async () => {
      let message = 'Weekly update via admin editor';
      try {
        const parsed = body ? JSON.parse(body) : {};
        if (parsed.message && typeof parsed.message === 'string') message = parsed.message.slice(0, 200);
      } catch (e) { /* ignore malformed body, fall back to default message */ }

      // Always run the full chain — add/commit/push are each safe to run with
      // nothing to do (git no-ops them). That also means a retry after a failed
      // push (e.g. network hiccup) correctly picks up and pushes the commit
      // that's already sitting locally, instead of wrongly reporting "nothing
      // to publish" just because the working tree happens to be clean.
      const add = await git(['add', 'stats/data.js']);
      if (!add.ok) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: add.stderr || 'git add failed' }));
        console.log(`  ✘ publish failed at add: ${add.stderr}`);
        return;
      }

      const commit = await git(['commit', '-m', message]);
      // git phrases "nothing staged" differently depending on whether other
      // files happen to be dirty elsewhere in the working tree — match both.
      const nothingToCommit = !commit.ok && /nothing to commit|no changes added to commit/i.test(commit.stdout + commit.stderr);
      if (!commit.ok && !nothingToCommit) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: commit.stderr || commit.stdout || 'git commit failed' }));
        console.log(`  ✘ publish failed at commit: ${commit.stderr || commit.stdout}`);
        return;
      }

      const push = await git(['push']);
      if (!push.ok) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: push.stderr || push.stdout || 'git push failed' }));
        console.log(`  ✘ publish failed at push: ${push.stderr || push.stdout}`);
        return;
      }

      const upToDate = /up.to.date/i.test(push.stdout + push.stderr);
      if (nothingToCommit && upToDate) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, published: false, message: 'Already up to date — nothing to publish.' }));
        console.log('  ○ publish: nothing to commit or push');
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, published: true, message: 'Pushed — the live site will update in about a minute.' }));
        console.log(`  🚀 published: ${message}`);
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

// Bind to localhost only — this now has a /api/publish endpoint that can push
// to GitHub, so it must not be reachable by anything else on the network.
server.listen(PORT, '127.0.0.1', () => {
  console.log(`
  ⚽  Acca data editor is running
  →  http://localhost:${PORT}/stats/admin/

  Edits are written to stats/data.js (previous version kept as data.js.bak).
  Press Ctrl+C to stop.
`);
});
