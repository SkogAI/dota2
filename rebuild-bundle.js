#!/usr/bin/env node
// Rebuilds worker-bundle.js from the HTML source files
const fs = require('fs');

const squad = fs.readFileSync('squad-stats.html', 'utf8');
const solo = fs.readFileSync('skogix-dota2-stats.html', 'utf8');
const draft = fs.readFileSync('dota2-draft-helper.html', 'utf8');
const worst = fs.readFileSync('worst-matches.html', 'utf8');

const old = fs.readFileSync('worker-bundle.js', 'utf8');
const exportIdx = old.indexOf('\nexport default');
if (exportIdx === -1) {
  console.error('ERROR: could not find "export default" in worker-bundle.js');
  process.exit(1);
}
const routerCode = old.substring(exportIdx);

const navHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Dota 2 Hub</title><style>body{font-family:sans-serif;background:#0f1923;color:#e2e8f0;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}.hub{text-align:center}.hub h1{font-size:36px;background:linear-gradient(135deg,#e94560,#f5a623);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:24px}.hub a{display:block;color:#60a5fa;font-size:18px;margin:12px;text-decoration:none;padding:12px 24px;border:1px solid #243447;border-radius:12px;transition:all .2s}.hub a:hover{background:rgba(96,165,250,.1);border-color:#60a5fa}</style></head><body><div class="hub"><h1>Dota 2 Squad Hub</h1><a href="/">Squad Stats</a><a href="/solo">Solo Stats</a><a href="/draft">Draft Helper</a><a href="/worst">Wall of Shame</a></div></body></html>`;

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
}

const bundle = '// Dota 2 Squad Hub - Cloudflare Worker\n' +
  'const PAGES = {\n' +
  "  '/': '" + esc(squad) + "',\n" +
  "  '/squad': '" + esc(squad) + "',\n" +
  "  '/solo': '" + esc(solo) + "',\n" +
  "  '/draft': '" + esc(draft) + "',\n" +
  "  '/worst': '" + esc(worst) + "',\n" +
  "  '/nav': '" + esc(navHtml) + "'\n" +
  '};' + routerCode;

fs.writeFileSync('worker-bundle.js', bundle);
console.log(`  worker-bundle.js rebuilt (${(bundle.length / 1024).toFixed(0)} KB)`);
