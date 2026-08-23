import { test, describe } from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const binPath = path.join(repoRoot, 'bin', 'machine-trust.js');
const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

function makeTempCwd(t) {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-trust-cli-'));
  t.after(() => fs.rmSync(sandbox, { recursive: true, force: true }));
  return sandbox;
}

describe('CLI smoke tests', () => {
  test('--help exits 0 and prints usage without touching the working directory', (t) => {
    const cwd = makeTempCwd(t);
    const result = spawnSync(process.execPath, [binPath, '--help'], { cwd, encoding: 'utf8' });

    assert.strictEqual(result.error, undefined);
    assert.strictEqual(result.status, 0);
    assert.match(result.stdout, /USAGE:/);
    assert.match(result.stdout, /machine-trust <command>/);
    assert.deepStrictEqual(fs.readdirSync(cwd), []);
  });

  test('--version exits 0 and reports the package version', (t) => {
    const cwd = makeTempCwd(t);
    const result = spawnSync(process.execPath, [binPath, '--version'], { cwd, encoding: 'utf8' });

    assert.strictEqual(result.error, undefined);
    assert.strictEqual(result.status, 0);
    assert.strictEqual(result.stdout.trim(), `@nymrel/machine-trust v${pkg.version}`);
    assert.deepStrictEqual(fs.readdirSync(cwd), []);
  });

  test('fails closed with an actionable build error when dist is missing', (t) => {
    const sandbox = makeTempCwd(t);

    // Stage a minimal package layout containing the CLI but no compiled dist/,
    // mirroring a consumer who skipped the build step. The engine load happens
    // before any config or output write, so nothing else is created.
    const pkgRoot = path.join(sandbox, 'pkg');
    fs.mkdirSync(path.join(pkgRoot, 'bin'), { recursive: true });
    fs.copyFileSync(binPath, path.join(pkgRoot, 'bin', 'machine-trust.js'));
    fs.writeFileSync(
      path.join(pkgRoot, 'package.json'),
      JSON.stringify({ name: 'machine-trust-sandbox', version: '0.0.0', type: 'module' }),
      'utf8'
    );

    const result = spawnSync(process.execPath, [
      path.join(pkgRoot, 'bin', 'machine-trust.js'),
      'generate',
    ], { cwd: sandbox, encoding: 'utf8' });

    assert.strictEqual(result.status, 1);
    assert.match(result.stderr, /Build output not found/);
    assert.match(result.stderr, /npm run build/);
    // Fail-closed: no partial output leaked into the working directory.
    assert.deepStrictEqual(fs.readdirSync(sandbox), ['pkg']);
  });

  test('audit loads the compiled engine and scores a config end-to-end', (t) => {
    const sandbox = makeTempCwd(t);

    // Self-contained fixture: exercises the dynamic import of dist/index.js,
    // which must work on Windows where bare absolute paths are invalid ESM
    // specifiers (ERR_UNSUPPORTED_ESM_URL_SCHEME).
    const html = `<!DOCTYPE html>
<html lang="en">
<head><title>Test Shop</title></head>
<body>
  <h1>Test Widget</h1>
  <p>Test Widget is a dependable widget for demanding households.</p>
  <p class="price">$19.00 - In stock</p>
  <footer><p>Test Shop - hello@testshop.example</p></footer>
</body>
</html>`;
    const config = {
      entity: {
        name: 'Test Shop',
        url: 'https://testshop.example',
        description: 'A dependable shop for demanding households.',
        email: 'hello@testshop.example',
      },
      product: {
        name: 'Test Widget',
        description: 'The Test Widget is a dependable widget for demanding households.',
        brand: 'Test Shop',
        offers: [{ price: '19.00', priceCurrency: 'USD', availability: 'InStock' }],
      },
      robotsTxt: { posture: 'allow_ai_search_disallow_training' },
    };
    fs.writeFileSync(path.join(sandbox, 'index.html'), html, 'utf8');
    fs.writeFileSync(path.join(sandbox, 'machine-trust.config.json'), JSON.stringify(config), 'utf8');

    const result = spawnSync(process.execPath, [
      binPath,
      'audit',
      '--config', './machine-trust.config.json',
      '--html', './index.html',
      '--report', './MACHINE_TRUST_SCORECARD.md',
    ], { cwd: sandbox, encoding: 'utf8' });

    assert.strictEqual(result.error, undefined);
    assert.strictEqual(result.status, 0);
    assert.match(result.stdout, /Overall Score:/);
    assert.match(result.stdout, /0 Failed/);
    const report = fs.readFileSync(path.join(sandbox, 'MACHINE_TRUST_SCORECARD.md'), 'utf8');
    assert.match(report, /Audit Score:/);
  });
});
