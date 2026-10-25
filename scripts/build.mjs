// Builds www/ (what the app ships) from the game's web folder:
//   1. copies game/web (or $FIVE_TRAILS_WEB) into www/
//   2. points the game at your server ($FT_SERVER_URL, e.g. wss://play.example.com/ws)
//   3. bundles src/native.js (purchases, reminders) into www/native.js and loads it before app.js
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';

const fail = (msg) => { console.error(`\n  build failed: ${msg}\n`); process.exit(1); };
const src = process.env.FIVE_TRAILS_WEB || 'game/web';
const server = (process.env.FT_SERVER_URL || '').trim();

if (!existsSync(`${src}/index.html`) || !existsSync(`${src}/app.js`)) {
  fail(`no game found at ${src}. Run: git submodule update --init (or set FIVE_TRAILS_WEB)`);
}
if (!/^wss:\/\/[^\s"<>]+$/.test(server) && !(process.env.FT_ALLOW_INSECURE === '1' && /^ws:\/\/[^\s"<>]+$/.test(server))) {
  fail('set FT_SERVER_URL to your game server, e.g. FT_SERVER_URL=wss://play.example.com/ws npm run sync');
}

rmSync('www', { recursive: true, force: true });
cpSync(src, 'www', { recursive: true });

await build({ entryPoints: ['src/native.js'], bundle: true, format: 'iife', minify: true, target: 'safari15', outfile: 'www/native.js', logLevel: 'warning' });

let html = readFileSync('www/index.html', 'utf8');
const meta = /<meta name="five-trails-server" content="[^"]*">/;
const appTag = /<script src="app\.js"/;
if (!meta.test(html) || !appTag.test(html)) fail('www/index.html does not look like the Five Trails game page');
html = html.replace(meta, `<meta name="five-trails-server" content="${server}">`);
html = html.replace(appTag, '<script src="native.js"></script>\n<script src="app.js"');
writeFileSync('www/index.html', html);
console.log(`  www/ built from ${src}, server ${server}`);
