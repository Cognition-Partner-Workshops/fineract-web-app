/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// Run with `node --test server/`.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp, renderEnvTemplate } = require('./server');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'web-app-'));
  fs.mkdirSync(path.join(root, 'assets'));
  fs.writeFileSync(path.join(root, 'index.html'), '<html>app</html>');
  fs.writeFileSync(path.join(root, 'main.js'), 'console.log(1)');
  fs.writeFileSync(
    path.join(root, 'assets', 'env.template.js'),
    "window['env']['fineractApiUrl'] = '$FINERACT_API_URL'; window['env']['x'] = '${UNSET_VAR}';"
  );
  fs.writeFileSync(path.join(os.tmpdir(), 'outside.txt'), 'secret');
  return root;
}

async function withServer(env, fn) {
  const server = createApp({ root: fixture(), env });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('renderEnvTemplate substitutes set variables and blanks unset ones', () => {
  assert.strictEqual(renderEnvTemplate("a='$A' b='${B}' c='$C'", { A: '1', B: '2' }), "a='1' b='2' c=''");
});

test('GET /health answers 200', async () => {
  await withServer({}, async (base) => {
    const res = await fetch(`${base}/health`);
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(await res.json(), { status: 'UP' });
  });
});

test('serves index.html at / and static files with a content type', async () => {
  await withServer({}, async (base) => {
    const index = await fetch(`${base}/`);
    assert.strictEqual(index.status, 200);
    assert.match(index.headers.get('content-type'), /text\/html/);
    assert.strictEqual(await index.text(), '<html>app</html>');
    const js = await fetch(`${base}/main.js`);
    assert.strictEqual(js.status, 200);
    assert.match(js.headers.get('content-type'), /javascript/);
  });
});

test('renders assets/env.js from the environment', async () => {
  await withServer({ FINERACT_API_URL: 'https://fineract.example' }, async (base) => {
    const res = await fetch(`${base}/assets/env.js`);
    assert.strictEqual(res.status, 200);
    const body = await res.text();
    assert.match(body, /'https:\/\/fineract\.example'/);
    assert.match(body, /\['x'\] = '';/);
  });
});

test('returns 404 for missing files and path traversal', async () => {
  await withServer({}, async (base) => {
    assert.strictEqual((await fetch(`${base}/nope.js`)).status, 404);
    assert.strictEqual((await fetch(`${base}/..%2Foutside.txt`)).status, 404);
    assert.strictEqual((await fetch(`${base}/%2e%2e/outside.txt`)).status, 404);
  });
});

test('rejects methods other than GET and HEAD', async () => {
  await withServer({}, async (base) => {
    assert.strictEqual((await fetch(`${base}/`, { method: 'POST' })).status, 405);
  });
});
