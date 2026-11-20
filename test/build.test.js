'use strict';

// Builds the site into dist/ and checks the pre-rendered pages.
const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const PAGES = {
    '': { lang: 'uz-Latn', dir: 'ltr', h1: 'Oʻzbek yozuvlari' },
    'yangi-lotin/': { lang: 'uz-Latn', dir: 'ltr', h1: 'Özbek yozuvlari' },
    'kirill/': { lang: 'uz-Cyrl', dir: 'ltr', h1: 'Ўзбек ёзувлари' },
    'arab/': { lang: 'uz-Arab', dir: 'rtl', h1: 'ئۉزبېک يازۇۋلەرى' },
    'yanalif/': { lang: 'uz-Latn', dir: 'ltr', h1: 'Ozʙek jazuvlari' },
    'en/': { lang: 'en', dir: 'ltr', h1: 'Uzbek scripts' },
    'ru/': { lang: 'ru', dir: 'ltr', h1: 'Узбекская письменность' }
};

test('build pre-renders every interface language', () => {
    execFileSync(process.execPath, [path.join(ROOT, 'build', 'build.mjs')], { cwd: ROOT, stdio: 'pipe' });

    for (const [slug, want] of Object.entries(PAGES)) {
        const html = fs.readFileSync(path.join(DIST, slug, 'index.html'), 'utf8');
        assert.match(html, new RegExp(`<html lang="${want.lang}" dir="${want.dir}"`), slug + ' lang/dir');
        assert.ok(html.includes(`<h1 class="app-title">${want.h1}</h1>`), slug + ' heading');
        assert.ok(html.includes(`<link rel="canonical" href="https://otabekoff.github.io/uzbek-transliterator/${slug}">`), slug + ' canonical');
        assert.ok(!html.includes('[['), slug + ': a [[protected]] marker leaked into the page');
        assert.match(html, /<script type="application\/ld\+json">/, slug + ' structured data');
    }

    // Protected terms stay untouched inside the converted Uzbek interfaces.
    const cyr = fs.readFileSync(path.join(DIST, 'kirill', 'index.html'), 'utf8');
    assert.ok(cyr.includes('[[') === false && cyr.includes('Oʻ, Gʻ, Sh, Ch'), 'letter examples stay Latin');
    assert.ok(cyr.includes('Uzbek Transliterator'), 'brand stays Latin');
});

test('build writes the PWA and search-engine files', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(DIST, 'manifest.webmanifest'), 'utf8'));
    assert.equal(manifest.display, 'standalone');
    for (const icon of manifest.icons) {
        assert.ok(fs.existsSync(path.join(DIST, icon.src)), 'manifest icon ' + icon.src);
    }

    const sw = fs.readFileSync(path.join(DIST, 'sw.js'), 'utf8');
    assert.ok(!sw.includes('__VERSION__') && !sw.includes('__PRECACHE__'), 'service worker placeholders filled');
    const precache = JSON.parse(sw.match(/const PRECACHE = (\[[\s\S]*?\]);/)[1]);
    for (const url of precache) {
        const clean = url.replace(/^\.\//, '').replace(/\?.*$/, '');
        const file = path.join(DIST, clean, clean === '' || clean.endsWith('/') ? 'index.html' : '');
        assert.ok(fs.existsSync(file), 'pre-cached file exists: ' + url);
    }

    // Every script and stylesheet the root page loads is pre-cached under the same URL,
    // so the page works offline and a new build never reuses an old cached copy.
    const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    const loaded = [...html.matchAll(/(?:href|src)="(assets\/(?:scripts|styles|vendor)\/[^"]+)"/g)].map(m => './' + m[1]);
    assert.ok(loaded.length >= 4, 'page loads its scripts and styles');
    for (const url of loaded) {
        assert.ok(precache.includes(url), 'loaded and pre-cached: ' + url);
    }
    assert.ok(loaded.some(u => /main\.css\?v=[0-9a-f]{12}$/.test(u)), 'styles are versioned');

    const sitemap = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
    assert.equal((sitemap.match(/<loc>/g) || []).length, Object.keys(PAGES).length);
    assert.match(fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf8'), /Sitemap: .*sitemap\.xml/);
});
