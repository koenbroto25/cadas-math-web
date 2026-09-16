/**
 * build-web.js — Reproducible web build untuk CADAS App (PWA).
 *
 * Masalah yang diselesaikan: `npx expo export -p web` menimpa dist/index.html
 * tanpa tag PWA (manifest link, theme-color, apple-mobile-web-app-*). Script ini
 * menjalankan export lalu menyuntikkan kembali konfigurasi PWA + menyalin file
 * deploy (server.js, package.json, vercel.json, manifest.json) ke dist/.
 *
 * Usage:
 *   node scripts/build-web.js            # full build + PWA patch
 *   node scripts/build-web.js --skip-export   # hanya patch dist/ yang sudah ada
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DEPLOY_DIR = path.join(ROOT, 'deploy', 'web');
const skipExport = process.argv.includes('--skip-export');

// Tag PWA yang harus ada di <head> dist/index.html
const PWA_HEAD_TAGS = [
  '<link rel="manifest" href="/manifest.json" />',
  '<meta name="theme-color" content="#E6F4FE" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  '<meta name="apple-mobile-web-app-title" content="CADAS" />',
  '<meta name="description" content="Belajar matematika cepat dengan voice bot CADAS" />',
];

const TITLE = 'CADAS Matematika';

function step(msg) {
  console.log(`\n▶ ${msg}`);
}

function copyFile(from, to) {
  fs.copyFileSync(from, to);
  console.log(`  ✓ ${path.relative(ROOT, to)}`);
}

function runExport() {
  step('Menjalankan expo export -p web ...');
  execSync('npx expo export -p web', { cwd: ROOT, stdio: 'inherit' });
}

function patchIndexHtml() {
  step('Menyuntikkan tag PWA ke dist/index.html ...');
  const indexPath = path.join(DIST, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');

  // Ganti title default
  html = html.replace(/<title>.*?<\/title>/, `<title>${TITLE}</title>`);

  // Buang tag PWA lama (idempotent) lalu inject ulang sebelum </head>
  const patterns = [
    /<link rel="manifest"[^>]*\/?>\s*/g,
    /<meta name="theme-color"[^>]*\/?>\s*/g,
    /<meta name="mobile-web-app-capable"[^>]*\/?>\s*/g,
    /<meta name="apple-mobile-web-app-capable"[^>]*\/?>\s*/g,
    /<meta name="apple-mobile-web-app-status-bar-style"[^>]*\/?>\s*/g,
    /<meta name="apple-mobile-web-app-title"[^>]*\/?>\s*/g,
    /<meta name="description"[^>]*\/?>\s*/g,
  ];
  for (const re of patterns) html = html.replace(re, '');

  const indent = '  ';
  const block = PWA_HEAD_TAGS.map((t) => indent + t).join('\n');
  html = html.replace('</head>', `${block}\n</head>`);

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log(`  ✓ dist/index.html (${PWA_HEAD_TAGS.length} tag PWA)`);
}

function verifyIndexHtml() {
  step('Verifikasi dist/index.html ...');
  const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  let ok = true;
  for (const tag of PWA_HEAD_TAGS) {
    const key = tag.slice(0, tag.indexOf(' '));
    const attr = tag.match(/(?:href|content|name)="([^"]+)"/);
    const needle = attr ? attr[1] : tag;
    if (!html.includes(needle)) {
      console.error(`  ✗ MISSING: ${tag}`);
      ok = false;
    }
  }
  if (!html.includes(`<title>${TITLE}</title>`)) {
    console.error('  ✗ MISSING: title');
    ok = false;
  }
  if (!html.includes('/_expo/static/js/web/')) {
    console.error('  ✗ MISSING: bundle script');
    ok = false;
  }
  if (ok) console.log('  ✓ semua tag PWA + bundle terverifikasi');
  return ok;
}

function copyDeployFiles() {
  step('Menyalin file deploy ke dist/ ...');
  const files = [
    [path.join(PUBLIC_DIR, 'manifest.json'), path.join(DIST, 'manifest.json')],
    [path.join(PUBLIC_DIR, 'vercel.json'), path.join(DIST, 'vercel.json')],
    [path.join(DEPLOY_DIR, 'server.js'), path.join(DIST, 'server.js')],
    [path.join(DEPLOY_DIR, 'package.json'), path.join(DIST, 'package.json')],
  ];
  for (const [from, to] of files) {
    if (!fs.existsSync(from)) {
      console.error(`  ✗ SUMBER HILANG: ${from}`);
      process.exitCode = 1;
      continue;
    }
    copyFile(from, to);
  }
}

// Ikon PWA yang direferensikan manifest.json (/assets/icon.png) + favicon.
const PWA_ICONS = [
  ['icon.png', 'icon.png'],
  ['favicon.png', 'favicon.png'],
];

function copyIcons() {
  step('Menyalin ikon PWA ke dist/assets/ ...');
  const srcDir = path.join(ROOT, 'assets');
  const dstDir = path.join(DIST, 'assets');
  fs.mkdirSync(dstDir, { recursive: true });
  for (const [srcName, dstName] of PWA_ICONS) {
    const from = path.join(srcDir, srcName);
    const to = path.join(dstDir, dstName);
    if (!fs.existsSync(from)) {
      console.error(`   SUMBER HILANG: ${from}`);
      process.exitCode = 1;
      continue;
    }
    copyFile(from, to);
  }
}

function verifyIcons() {
  step('Verifikasi ikon PWA ...');
  let ok = true;
  const manifestPath = path.join(DIST, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const icon of manifest.icons || []) {
    const rel = icon.src.replace(/^\//, '');
    const p = path.join(DIST, rel);
    if (!fs.existsSync(p)) {
      console.error(`   MISSING: manifest icon ${icon.src}`);
      ok = false;
    } else if (fs.statSync(p).size === 0) {
      console.error(`   EMPTY: manifest icon ${icon.src}`);
      ok = false;
    }
  }
  if (ok) console.log(`  ✓ semua ${(manifest.icons || []).length} ikon manifest ada`);
  return ok;
}

function report() {
  step('Ringkasan dist/ ...');
  const size = (p) => (fs.statSync(p).size / 1024).toFixed(1) + ' KB';
  for (const name of ['index.html', 'manifest.json', 'server.js', 'package.json', 'vercel.json']) {
    const p = path.join(DIST, name);
    if (fs.existsSync(p)) console.log(`  ${name.padEnd(16)} ${size(p)}`);
  }
  const jsDir = path.join(DIST, '_expo', 'static', 'js', 'web');
  if (fs.existsSync(jsDir)) {
    for (const f of fs.readdirSync(jsDir)) {
      const s = fs.statSync(path.join(jsDir, f)).size;
      console.log(`  bundle           ${(s / 1024 / 1024).toFixed(2)} MB  ${f}`);
    }
  }
}

function main() {
  console.log('='.repeat(60));
  console.log('CADAS WEB BUILD (reproducible + PWA patch)');
  console.log('='.repeat(60));

  if (!skipExport) runExport();
  else console.log('\n▶ --skip-export: memakai dist/ yang sudah ada');

  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('\n✗ dist/index.html tidak ditemukan — jalankan tanpa --skip-export');
    process.exit(1);
  }

  patchIndexHtml();
  copyDeployFiles();
  copyIcons();
  const ok = verifyIndexHtml();
  const iconsOk = verifyIcons();
  report();

  console.log('\n' + '='.repeat(60));
  if (ok && iconsOk && !process.exitCode) {
    console.log('✅ BUILD SELESAI — dist/ siap serve / deploy');
    console.log('   Local : node dist/server.js   → http://localhost:3000');
    console.log('   Deploy: cd dist; railway up --service cadas-web');
  } else {
    console.log('❌ BUILD SELESAI DENGAN MASALAH — periksa output di atas');
  }
  console.log('='.repeat(60));
}

main();