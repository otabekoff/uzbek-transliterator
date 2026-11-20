// Static site build: pre-renders one page per interface language into dist/,
// then writes the PWA manifest, the service worker, sitemap.xml and robots.txt.
//
//   node build/build.mjs            -> dist/
//   SITE_URL=https://example.com/ node build/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import uz from '../src/i18n/uz.mjs';
import en from '../src/i18n/en.mjs';
import ru from '../src/i18n/ru.mjs';
import { renderPage } from './page.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist');
const SITE = (process.env.SITE_URL || 'https://otabekoff.github.io/uzbek-transliterator/').replace(/\/?$/, '/');

const require = createRequire(import.meta.url);
const Translit = require('../src/scripts/translit.js');
const { convert, SCRIPTS, SOURCE_SCRIPTS } = Translit;

// --- interface languages -------------------------------------------------------

// [[...]], HTML tags, <code> blocks, entities and {placeholders} are never transliterated.
const PROTECTED = /\[\[([\s\S]*?)\]\]|<code\b[^>]*>[\s\S]*?<\/code>|<[^>]+>|&[a-zA-Z0-9#]+;|\{[a-z]+\}/g;

function writeIn(script, value) {
    let out = '';
    let last = 0;
    for (const m of value.matchAll(PROTECTED)) {
        out += convert(value.slice(last, m.index), 'latin', script);
        out += m[1] !== undefined ? m[1] : m[0];
        last = m.index + m[0].length;
    }
    return out + convert(value.slice(last), 'latin', script);
}

const stripMarkers = value => value.replace(/\[\[([\s\S]*?)\]\]/g, '$1');
const mapValues = (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));

// Uzbek interfaces: one per script, all generated from uz.mjs.
const uzbek = (id, slug, script, extra) => Object.assign({
    id, slug, script, plural: 'uz',
    strings: mapValues(uz, v => writeIn(script, v)),
    autonym: writeIn(script, 'Oʻzbekcha (' + { latin: 'lotin', latin2026: 'yangi lotin', cyrillic: 'kirill', arabic: 'arab', yanalif: 'yanalif' }[script] + ')')
}, extra);

const LOCALES = [
    uzbek('uz', '', 'latin', { lang: 'uz-Latn', hreflang: 'uz', ogLocale: 'uz_UZ', from: 'latin', to: 'cyrillic' }),
    uzbek('uz-2026', 'yangi-lotin/', 'latin2026', { lang: 'uz-Latn', ogLocale: 'uz_UZ', from: 'latin', to: 'latin2026' }),
    uzbek('uz-Cyrl', 'kirill/', 'cyrillic', { lang: 'uz-Cyrl', hreflang: 'uz-Cyrl', ogLocale: 'uz_UZ', from: 'cyrillic', to: 'latin' }),
    uzbek('uz-Arab', 'arab/', 'arabic', { lang: 'uz-Arab', hreflang: 'uz-Arab', ogLocale: 'uz_AF', dir: 'rtl', from: 'latin', to: 'arabic' }),
    uzbek('uz-yanalif', 'yanalif/', 'yanalif', { lang: 'uz-Latn', ogLocale: 'uz_UZ', from: 'latin', to: 'yanalif' }),
    { id: 'en', slug: 'en/', lang: 'en', hreflang: 'en', ogLocale: 'en_US', plural: 'en', autonym: 'English',
        strings: mapValues(en, stripMarkers), from: 'latin', to: 'cyrillic' },
    { id: 'ru', slug: 'ru/', lang: 'ru', hreflang: 'ru', ogLocale: 'ru_RU', plural: 'ru', autonym: 'Русский',
        strings: mapValues(ru, stripMarkers), from: 'cyrillic', to: 'latin' }
];

// Every language must define every key the Uzbek source defines.
for (const locale of LOCALES) {
    const missing = Object.keys(uz).filter(k => !(k in locale.strings));
    if (missing.length) { throw new Error(`${locale.id}: missing strings ${missing.join(', ')}`); }
}

// --- helpers --------------------------------------------------------------------

function write(rel, content) {
    const file = path.join(OUT, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
}

function listFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
        const full = path.join(dir, d.name);
        return d.isDirectory() ? listFiles(full) : [full];
    });
}

const rel = file => path.relative(OUT, file).split(path.sep).join('/');

// --- build ------------------------------------------------------------------------

// Published layout: dist/assets/ holds the static assets (images, vendor) plus the
// page scripts and styles from src/.
fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true });
fs.cpSync(path.join(ROOT, 'src', 'scripts'), path.join(OUT, 'assets', 'scripts'), { recursive: true });
fs.cpSync(path.join(ROOT, 'src', 'styles'), path.join(OUT, 'assets', 'styles'), { recursive: true });

const icons = fs.readFileSync(path.join(ROOT, 'src', 'icons.svg'), 'utf8').trim();

// The version changes whenever any source file changes; it names the service-worker cache.
const hash = crypto.createHash('sha256');
for (const file of [...listFiles(path.join(ROOT, 'assets')), ...listFiles(path.join(ROOT, 'src')), ...listFiles(path.join(ROOT, 'build'))].sort()) {
    hash.update(rel(file)).update(fs.readFileSync(file));
}
const version = hash.digest('hex').slice(0, 12);

for (const locale of LOCALES) {
    const t = key => {
        if (!(key in locale.strings)) { throw new Error(`${locale.id}: unknown string ${key}`); }
        return locale.strings[key];
    };
    write(path.join(locale.slug, 'index.html'), renderPage({
        locale, locales: LOCALES, t, site: SITE, convert,
        scripts: SCRIPTS, sourceScripts: SOURCE_SCRIPTS, icons, version
    }));
}

// Web app manifest (one app for every language; it opens the root page).
write('manifest.webmanifest', JSON.stringify({
    id: './',
    name: 'Uzbek Transliterator · Oʻzbek yozuvlari',
    short_name: 'Transliterator',
    description: en['meta.description'],
    lang: 'uz',
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0099b5',
    categories: ['education', 'utilities'],
    icons: [
        { src: 'assets/images/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        { src: 'assets/images/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'assets/images/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: 'assets/images/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
}, null, 2));

// Service worker: pre-caches every page and asset (source maps and licences excluded).
const precache = [
    ...LOCALES.map(l => './' + l.slug),
    './manifest.webmanifest',
    // Pages load these three with ?v=<version> so a new build never gets an old cached copy.
    ...listFiles(path.join(OUT, 'assets')).map(rel).filter(f => !/\.map$|LICENSE$/.test(f))
        .map(f => './' + f + (/^assets\/(scripts|styles)\//.test(f) ? '?v=' + version : ''))
];
const sw = fs.readFileSync(path.join(ROOT, 'src', 'sw.js'), 'utf8')
    .replace('__VERSION__', version)
    .replace('__PRECACHE__', JSON.stringify(precache, null, 4));
write('sw.js', sw);

// Search engines.
const today = new Date().toISOString().slice(0, 10);
const alternates = LOCALES.filter(l => l.hreflang)
    .map(l => `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${SITE + l.slug}"/>`)
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}"/>`).join('\n');
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${LOCALES.map(l => `  <url>
    <loc>${SITE + l.slug}</loc>
    <lastmod>${today}</lastmod>
${l.hreflang ? alternates + '\n' : ''}  </url>`).join('\n')}
</urlset>
`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);
write('.nojekyll', '');

// GitHub Pages serves 404.html for unknown paths: send visitors to the home page.
write('404.html', `<!doctype html>
<html lang="uz"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<title>404 · Uzbek Transliterator</title>
<meta http-equiv="refresh" content="0; url=${SITE}"></head>
<body><a href="${SITE}">Uzbek Transliterator</a></body></html>
`);

console.log(`Built ${LOCALES.length} pages, ${precache.length} cached files, version ${version} -> ${path.relative(ROOT, OUT)}/`);
