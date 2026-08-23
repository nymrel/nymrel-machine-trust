import { test, describe } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const specimenDir = path.join(repoRoot, 'specimens', 'halcyon-coffee');
const outputDir = path.join(specimenDir, 'output');
const generator = path.join(specimenDir, 'generate.mjs');
const sha256 = (filePath) =>
  crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
const outputHashes = () =>
  Object.fromEntries(
    fs.readdirSync(outputDir)
      .filter((name) => fs.statSync(path.join(outputDir, name)).isFile())
      .sort()
      .map((name) => [name, sha256(path.join(outputDir, name))])
  );

describe('Halcyon Coffee deterministic specimen', () => {
  test('regenerates byte-identically with one nonfatal warning', () => {
    const before = outputHashes();
    const result = spawnSync(process.execPath, [generator], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    const after = outputHashes();

    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /warnings=1; failures=0/);
    assert.deepStrictEqual(after, before);
  });

  test('provenance hashes every declared input and non-self-referential output', () => {
    const provenance = JSON.parse(
      fs.readFileSync(path.join(outputDir, 'provenance.json'), 'utf8')
    );

    assert.strictEqual(provenance.evidence_class, 'synthetic');
    assert.strictEqual(
      provenance.seeded_nonfatal_warning.id,
      'ANSWER_FIRST_WORD_COUNT'
    );
    assert.strictEqual(provenance.seeded_nonfatal_warning.status, 'WARN');
    assert.strictEqual(
      Object.hasOwn(provenance.outputs_sha256, 'provenance.json'),
      false
    );

    for (const [relativePath, expected] of Object.entries(
      provenance.inputs_sha256
    )) {
      assert.strictEqual(sha256(path.join(specimenDir, relativePath)), expected);
    }
    for (const [relativePath, expected] of Object.entries(
      provenance.outputs_sha256
    )) {
      assert.strictEqual(sha256(path.join(outputDir, relativePath)), expected);
    }
  });

  test('uses fictional .example URLs and no invented parent relationship', () => {
    const config = JSON.parse(
      fs.readFileSync(path.join(specimenDir, 'config.json'), 'utf8')
    );
    const jsonLd = JSON.parse(
      fs.readFileSync(path.join(outputDir, 'jsonld.json'), 'utf8')
    );
    const org = jsonLd['@graph'].find((item) => item['@type'] === 'Organization');

    assert.match(config.entity.url, /\.example$/);
    assert.strictEqual(org.parentOrganization, undefined);
    assert.strictEqual(org.creator, undefined);
  });
});
