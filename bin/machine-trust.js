#!/usr/bin/env node

/**
 * @nymrel/machine-trust CLI
 * Dual-Audience Machine Trust & AI Search Discoverability CLI
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load either src or dist depending on execution environment
async function loadEngine() {
  const distPath = path.resolve(__dirname, '../dist/index.js');
  const srcPath = path.resolve(__dirname, '../src/index.js');

  if (fs.existsSync(distPath)) {
    return await import(distPath);
  }
  // Try direct ts/js loader or fallback
  try {
    return await import(srcPath);
  } catch (e) {
    throw new Error(`Failed to load engine from dist (${distPath}) or src (${srcPath}): ${e.message}`);
  }
}

function printUsage() {
  console.log(`
\x1b[1m\x1b[36m@nymrel/machine-trust CLI\x1b[0m
Dual-Audience Machine Trust & AI Search Discoverability Engine

\x1b[1mUSAGE:\x1b[0m
  machine-trust <command> [options]

\x1b[1mCOMMANDS:\x1b[0m
  \x1b[32minit\x1b[0m [path]                  Generate a starter machine-trust.config.json template
  \x1b[32mgenerate\x1b[0m [options]           Generate JSON-LD, llms.txt, robots.txt, and answer-first blocks
  \x1b[32mvalidate\x1b[0m [options]           Validate JSON-LD, crawler eligibility, and DOM parity
  \x1b[32maudit\x1b[0m [options]              Run comprehensive 100-point audit and output Markdown scorecard
  \x1b[32mhelp\x1b[0m                         Show this help message

\x1b[1mOPTIONS:\x1b[0m
  -c, --config <file>        Path to machine-trust.config.json (default: ./machine-trust.config.json)
  -o, --outDir <dir>         Output directory for generated files (default: ./public)
  --html <file>              HTML file to test for DOM consistency
  --report <file>            Output path for audit scorecard (default: ./MACHINE_TRUST_SCORECARD.md)
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

  if (command === 'init') {
    const targetFile = args[1] || './machine-trust.config.json';
    const sampleConfig = {
      entity: {
        name: 'Nymrel Project',
        legalName: 'Nymrel Project (a JalenBuilds LLC product)',
        url: 'https://example.nymrel.com',
        logo: 'https://example.nymrel.com/logo.png',
        description: 'Autonomous high-performance web platform built under the Nymrel umbrella.',
        email: 'contact@jalenbuilds.com',
        parentOrganization: {
          name: 'Nymrel',
          legalName: 'Nymrel (a JalenBuilds LLC company)',
          url: 'https://nymrel.com',
          description: 'Autonomous software systems and digital services umbrella.',
          parentOrganization: {
            name: 'JalenBuilds LLC',
            legalName: 'JalenBuilds LLC',
            url: 'https://jalenbuilds.com',
            description: 'Parent holding company and technical venture studio.',
          },
        },
      },
      product: {
        name: 'Nymrel Flagship App',
        description: 'High-performance AI-search ready SaaS platform.',
        brand: 'Nymrel',
        url: 'https://example.nymrel.com',
        category: 'SoftwareApplication',
        offers: [
          {
            price: '49.00',
            priceCurrency: 'USD',
            availability: 'InStock',
          },
        ],
        softwareApplication: {
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'All',
          features: ['AI Search Ready', 'Dual-Audience Machine Trust', 'Sub-second SSR'],
        },
      },
      llmsTxt: {
        title: 'Nymrel Project Documentation for AI Agents',
        summary:
          'Nymrel Project provides modern autonomous digital infrastructure with full Dual-Audience machine trust compliance.',
        sections: [
          {
            title: 'Core Architecture',
            links: [
              {
                title: 'Machine Trust Standard',
                url: 'https://example.nymrel.com/docs/trust',
                description: 'Verifiable parent entity hierarchy and schema specifications.',
              },
              {
                title: 'API Reference',
                url: 'https://example.nymrel.com/docs/api',
                description: 'Autonomous purchasing and programmatic data interfaces.',
              },
            ],
          },
        ],
        tokenBudget: 4000,
      },
      robotsTxt: {
        sitemapUrl: 'https://example.nymrel.com/sitemap.xml',
        host: 'example.nymrel.com',
        posture: 'allow_ai_search_disallow_training',
      },
      answerFirst: {
        summary:
          'Nymrel Project is an enterprise-grade AI search discovery and machine trust platform that links autonomous digital services to verifiable corporate entity hierarchies for instant AI purchasing agent discovery.',
        keyTakeaways: [
          'Dual-Audience JSON-LD entity graph with JalenBuilds LLC parent organization',
          'Curated /llms.txt and /llms-full.txt machine index',
          'Explicit AI search bot crawler permissions for OAI-SearchBot and Perplexity',
        ],
      },
    };

    fs.writeFileSync(path.resolve(process.cwd(), targetFile), JSON.stringify(sampleConfig, null, 2), 'utf8');
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

  const config = JSON.parse(fs.readFileSync(fullConfigPath, 'utf8'));

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

    const scorecard = engine.runMachineTrustAudit(config, sampleHtml);
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
