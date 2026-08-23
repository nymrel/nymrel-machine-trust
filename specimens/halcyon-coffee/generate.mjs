import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const specimenDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(specimenDir, '..', '..');
const outputDir = path.join(specimenDir, 'output');
const fixedTimestamp = '2026-08-23T16:00:00.000Z';

const engine = await import(
  pathToFileURL(path.join(repoRoot, 'dist', 'index.js')).href
);
const packageJson = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')
);
const config = JSON.parse(
  fs.readFileSync(path.join(specimenDir, 'config.json'), 'utf8')
);
const html = fs.readFileSync(path.join(specimenDir, 'index.html'), 'utf8');

const write = (relativePath, content) => {
  const target = path.join(outputDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
};
const json = (value) => JSON.stringify(value, null, 2) + '\n';
const sha256 = (bytes) =>
  crypto.createHash('sha256').update(bytes).digest('hex');

const scorecard = engine.runMachineTrustAudit(config, html, {
  fixedTimestamp,
});
const seededWarning = scorecard.checks.find(
  (check) => check.id === 'ANSWER_FIRST_WORD_COUNT'
);

if (scorecard.failCount !== 0) {
  throw new Error(
    'Specimen must have zero failures; got ' + String(scorecard.failCount)
  );
}
if (seededWarning?.status !== 'WARN') {
  throw new Error('Expected ANSWER_FIRST_WORD_COUNT to remain a nonfatal warning');
}

write('jsonld.json', json(engine.generateJsonLd(config)));
write('llms.txt', engine.generateLlmsTxt(config.llmsTxt));
write('llms-full.txt', engine.generateLlmsFullTxt(config.llmsTxt));
write('robots.txt', engine.generateRobotsTxt(config.robotsTxt));
write(
  'answer-first-snippet.html',
  engine.generateAnswerFirstHtml(config.answerFirst)
);
write('scorecard.json', json(scorecard));
write('MACHINE_TRUST_SCORECARD.md', engine.generateMarkdownScorecard(scorecard));

const inputPaths = ['config.json', 'index.html'];
const outputPaths = [
  'MACHINE_TRUST_SCORECARD.md',
  'answer-first-snippet.html',
  'jsonld.json',
  'llms-full.txt',
  'llms.txt',
  'robots.txt',
  'scorecard.json',
];
const inputHashes = Object.fromEntries(
  inputPaths.map((relativePath) => [
    relativePath,
    sha256(fs.readFileSync(path.join(specimenDir, relativePath))),
  ])
);
const outputHashes = Object.fromEntries(
  outputPaths.map((relativePath) => [
    relativePath,
    sha256(fs.readFileSync(path.join(outputDir, relativePath))),
  ])
);

const provenance = {
  schema_version: 'machine-trust-specimen-provenance.v1',
  specimen: 'halcyon-coffee',
  evidence_class: 'synthetic',
  fixture_timestamp: fixedTimestamp,
  generator: {
    name: packageJson.name,
    version: packageJson.version,
  },
  inputs_sha256: inputHashes,
  outputs_sha256: outputHashes,
  seeded_nonfatal_warning: {
    id: seededWarning.id,
    status: seededWarning.status,
    message: seededWarning.message,
  },
  limitations: [
    'Fictional names and .example domains only.',
    'No live crawler, indexing, ranking, traffic, citation, customer, or revenue evidence.',
    'The warning is deliberately retained to demonstrate honest nonfatal reporting.',
    'provenance.json is excluded from its own output hash map to avoid self-reference.',
  ],
};
write('provenance.json', json(provenance));

console.log(
  'generated ' +
    String(outputPaths.length + 1) +
    ' deterministic files; score=' +
    String(scorecard.overallScore) +
    '; warnings=' +
    String(scorecard.warnCount) +
    '; failures=' +
    String(scorecard.failCount)
);
