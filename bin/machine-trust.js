#!/usr/bin/env node

/**
 * @nymrel/machine-trust CLI
 * Dual-Audience Machine Trust & AI Search Discoverability CLI
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the compiled engine from dist. There is no source fallback: shipping
// builds are produced by `npm run build` (tsc) and the CLI fails closed with an
// actionable error rather than attempting to load TypeScript sources at runtime.
async function loadEngine() {
  const distPath = path.resolve(__dirname, '../dist/index.js');

  if (!fs.existsSync(distPath)) {
    console.error(`\x1b[31m[✖] Build output not found: ${distPath}\x1b[0m`);
    console.error(`The machine-trust engine ships compiled to ./dist. Run \`npm run build\` in the package root, then retry.`);
    process.exit(1);
  }

  // Dynamic ESM import requires a file:// URL — bare absolute paths crash on
  // Windows (ERR_UNSUPPORTED_ESM_URL_SCHEME: protocol 'c:' unsupported).
  return await import(pathToFileURL(distPath).href);
}

function printUsage() {
  console.log(`
\x1b[1m\x1b[36m@nymrel/machine-trust CLI\x1b[0m
Dual-Audience Machine Trust & AI Search Discoverability Engine

\x1b[1mUSAGE:\x1b[0m
  machine-trust <command> [options]

\x1b[1mCOMMANDS:\x1b[0m
  \x1b[32minit\x1b[0m [path] [--force]        Generate a starter machine-trust.config.json template
  \x1b[32mgenerate\x1b[0m [options]           Generate JSON-LD, llms.txt, robots.txt, and answer-first blocks
  \x1b[32mvalidate\x1b[0m [options]           Validate JSON-LD, crawler eligibility, and DOM parity
  \x1b[32maudit\x1b[0m [options]              Run comprehensive 100-point audit and output Markdown scorecard
  \x1b[32mhelp\x1b[0m                         Show this help message

\x1b[1mOPTIONS:\x1b[0m
  -c, --config <file>        Path to machine-trust.config.json (default: ./machine-trust.config.json)
  -o, --outDir <dir>         Output directory for generated files (default: ./public)
  --html <file>              HTML file to test for DOM consistency
  --report <file>            Output path for audit scorecard (default: ./MACHINE_TRUST_SCORECARD.md)
  --fixed-timestamp <iso>    Record this ISO-8601 timestamp in the scorecard instead of the
                             current time; identical runs become byte-identical. Also settable
                             via MACHINE_TRUST_FIXED_TIMESTAMP (flag takes precedence).
  --force                    Allow init to replace an existing target file
  -v, --version              Show version

\x1b[1mEXAMPLES:\x1b[0m
  machine-trust init
  machine-trust generate --outDir ./public
  machine-trust audit --config ./machine-trust.config.json --html ./dist/index.html
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  if (command === '--help' || command === '-h' || command === 'help') {
    printUsage();
    process.exit(0);
  }

  if (command === '--version' || command === '-v') {
    const pkgPath = path.resolve(__dirname, '../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    console.log(`@nymrel/machine-trust v${pkg.version}`);
    process.exit(0);
  }

  // Parse options
  const getOpt = (shortFlag, longFlag, defaultValue) => {
    const idx = args.findIndex((a) => a === shortFlag || a === longFlag);
    if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('-')) {
      return args[idx + 1];
    }
    return defaultValue;
  };

  const configPath = getOpt('-c', '--config', './machine-trust.config.json');
  const outDir = getOpt('-o', '--outDir', './public');
  const htmlPath = getOpt(null, '--html', null);
  const reportPath = getOpt(null, '--report', './MACHINE_TRUST_SCORECARD.md');
  // Deterministic runs: explicit flag wins over MACHINE_TRUST_FIXED_TIMESTAMP;
  // when neither is set the engine records the current time (default behavior).
  const fixedTimestamp =
    getOpt(null, '--fixed-timestamp', null) ?? process.env.MACHINE_TRUST_FIXED_TIMESTAMP ?? undefined;
  const force = args.includes('--force');

  if (command === 'init') {
    const targetFile = args.slice(1).find((arg) => !arg.startsWith('-')) || './machine-trust.config.json';
    const fullTargetPath = path.resolve(process.cwd(), targetFile);
    const sampleConfig = {
      entity: {
        name: 'Your Business',
        legalName: 'Your Business LLC',
        url: 'https://www.yourbusiness.example',
        logo: 'https://www.yourbusiness.example/logo.png',
        description: 'Describe what your business offers in one clear sentence.',
        email: 'hello@yourbusiness.example',
      },
      product: {
        name: 'Your Flagship Product',
      description: 'One concrete sentence a buyer can verify on the page.',
      brand: 'Your Business',
      url: 'https://www.yourbusiness.example/product',
      category: 'SoftwareApplication',
      softwareApplication: {
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        features: ['Structured data generation', 'Machine index generation', 'Crawler policy generation'],
        },
      },
      llmsTxt: {
      title: 'Your Business Documentation for AI Agents',
      summary:
        'Describe the public facts and documentation that automated systems may inspect.',
        sections: [
          {
            title: 'Core Architecture',
            links: [
              {
                title: 'Machine Trust Standard',
                url: 'https://www.yourbusiness.example/docs/trust',
                description: 'Entity graph, structured data, and schema specifications.',
              },
              {
                title: 'API Reference',
                url: 'https://www.yourbusiness.example/docs/api',
                description: 'Programmatic and data interfaces.',
              },
            ],
          },
        ],
        tokenBudget: 4000,
      },
      robotsTxt: {
        sitemapUrl: 'https://www.yourbusiness.example/sitemap.xml',
        host: 'www.yourbusiness.example',
        posture: 'allow_ai_search_disallow_training',
      },
      answerFirst: {
      summary:
        'Your Business publishes structured data, a machine-readable index, and declared crawler rules that match the public page supplied for audit. Replace this starter text with verified facts, confirm entity relationships and contact details, then inspect every generated artifact, score, warning, and limitation before publishing it publicly.',
      keyTakeaways: [
        'Entity relationships come from explicit configuration only',
        'Machine index content should match public documentation',
        'Crawler rules express policy but do not prove indexing',
        ],
      },
    };

    if (fs.existsSync(fullTargetPath) && !force) {
      console.error(`\x1b[31m[✖] Refusing to overwrite existing config: ${fullTargetPath}\x1b[0m`);
      console.error('Choose a different path or re-run init with --force after reviewing the existing file.');
      process.exit(1);
    }

    fs.writeFileSync(fullTargetPath, JSON.stringify(sampleConfig, null, 2), 'utf8');
    console.log(`\x1b[32m[✓] Generated sample config at: ${targetFile}\x1b[0m`);
    process.exit(0);
  }

  // Load engine for generate / validate / audit
  const engine = await loadEngine();

  // Load config file
  const fullConfigPath = path.resolve(process.cwd(), configPath);
  if (!fs.existsSync(fullConfigPath)) {
    console.error(`\x1b[31m[✖] Config file not found: ${fullConfigPath}\x1b[0m`);
    console.error(`Run \`machine-trust init\` to create a starter configuration.`);
    process.exit(1);
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(fullConfigPath, 'utf8'));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`\x1b[31m[✖] Invalid JSON in config: ${fullConfigPath}\x1b[0m`);
    console.error(reason);
    process.exit(1);
  }

  if (command === 'generate') {
    const fullOutDir = path.resolve(process.cwd(), outDir);
    if (!fs.existsSync(fullOutDir)) {
      fs.mkdirSync(fullOutDir, { recursive: true });
    }

    // 1. JSON-LD
    const jsonLd = engine.generateJsonLd(config);
    const jsonLdPath = path.join(fullOutDir, 'jsonld.json');
    fs.writeFileSync(jsonLdPath, JSON.stringify(jsonLd, null, 2), 'utf8');
    console.log(`\x1b[32m[✓]\x1b[0m Generated JSON-LD Schema: ${path.relative(process.cwd(), jsonLdPath)}`);

    // 2. llms.txt & llms-full.txt
    if (config.llmsTxt) {
      const llmsTxt = engine.generateLlmsTxt(config.llmsTxt);
      const llmsTxtPath = path.join(fullOutDir, 'llms.txt');
      fs.writeFileSync(llmsTxtPath, llmsTxt, 'utf8');
      console.log(`\x1b[32m[✓]\x1b[0m Generated /llms.txt: ${path.relative(process.cwd(), llmsTxtPath)}`);

      const llmsFullTxt = engine.generateLlmsFullTxt(config.llmsTxt);
      const llmsFullTxtPath = path.join(fullOutDir, 'llms-full.txt');
      fs.writeFileSync(llmsFullTxtPath, llmsFullTxt, 'utf8');
      console.log(`\x1b[32m[✓]\x1b[0m Generated /llms-full.txt: ${path.relative(process.cwd(), llmsFullTxtPath)}`);
    }

    // 3. robots.txt
    const robotsTxt = engine.generateRobotsTxt(config.robotsTxt);
    const robotsTxtPath = path.join(fullOutDir, 'robots.txt');
    fs.writeFileSync(robotsTxtPath, robotsTxt, 'utf8');
    console.log(`\x1b[32m[✓]\x1b[0m Generated robots.txt: ${path.relative(process.cwd(), robotsTxtPath)}`);

    // 4. Answer-First Snippet
    if (config.answerFirst) {
      const answerFirstHtml = engine.generateAnswerFirstHtml(config.answerFirst);
      const answerFirstPath = path.join(fullOutDir, 'answer-first-snippet.html');
      fs.writeFileSync(answerFirstPath, answerFirstHtml, 'utf8');
      console.log(`\x1b[32m[✓]\x1b[0m Generated Answer-First HTML: ${path.relative(process.cwd(), answerFirstPath)}`);
    }

    console.log(`\n\x1b[32m[✓] All Dual-Audience machine-trust assets generated successfully in ${outDir}\x1b[0m`);
    process.exit(0);
  }

  if (command === 'validate' || command === 'audit') {
    let sampleHtml = '';
    if (htmlPath) {
      const fullHtmlPath = path.resolve(process.cwd(), htmlPath);
      if (fs.existsSync(fullHtmlPath)) {
        sampleHtml = fs.readFileSync(fullHtmlPath, 'utf8');
      } else {
        console.warn(`\x1b[33m[!] Specified HTML file not found: ${fullHtmlPath}. Proceeding without DOM parity check.\x1b[0m`);
      }
    }

    const scorecard = engine.runMachineTrustAudit(config, sampleHtml, { fixedTimestamp });
    console.log(engine.formatCliReport(scorecard));

    if (command === 'audit') {
      const mdReport = engine.generateMarkdownScorecard(scorecard);
      const fullReportPath = path.resolve(process.cwd(), reportPath);
      fs.writeFileSync(fullReportPath, mdReport, 'utf8');
      console.log(`\x1b[32m[✓] Saved Markdown Scorecard: ${path.relative(process.cwd(), fullReportPath)}\x1b[0m\n`);
    }

    if (scorecard.failCount > 0) {
      process.exit(1);
    }
    process.exit(0);
  }

  console.error(`\x1b[31mUnknown command: ${command}\x1b[0m`);
  printUsage();
  process.exit(1);
}

main().catch((err) => {
  console.error(`\x1b[31mFatal error: ${err.message}\x1b[0m\n`, err);
  process.exit(1);
});
