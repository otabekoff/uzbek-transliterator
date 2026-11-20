// Renders one localized page to static HTML (pre-rendered for search engines).
// Layout: an app workspace. A slim header, the two-pane converter filling the screen, a status
// line, and the guide (scripts, alphabet, rules, privacy, developers) in a side drawer.
import { ALPHABET, ALPHABET_COLUMNS, SAMPLE_LATIN } from '../src/data.mjs';

const REPO = 'https://github.com/otabekoff/uzbek-transliterator';
const PROVIDER = { name: 'MohirLab', url: 'https://mohirlab.uz' };
const AUTHOR = 'Otabek Sadiridinov';
const LANG_TAGS = { latin: 'uz-Latn', latin2026: 'uz-Latn', cyrillic: 'uz-Cyrl', arabic: 'uz-Arab', yanalif: 'uz-Latn' };
const EXPERIMENTAL = ['arabic', 'yanalif'];

// Interface strings the page script needs at run time.
const CLIENT_KEYS = /^(full|placeholder|exp|words|chars|toast)\./;

export function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]));
}

const e = escapeHtml;

function icon(name, cls = '') {
    return `<svg class="bi${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
}

const ACCORDION_ICON = '<svg class="accordion-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 5 6 6 6-6"/></svg>';

export function renderPage({ locale, locales, t, site, convert, scripts, sourceScripts, icons, version }) {
    const root = locale.slug ? '../' : '';
    const url = site + locale.slug;
    const from = locale.from;
    const to = locale.to;
    const dir = locale.dir || 'ltr';
    const scriptDir = script => script === 'arabic' ? 'rtl' : 'ltr';

    const alternates = locales.filter(l => l.hreflang)
        .map(l => `<link rel="alternate" hreflang="${l.hreflang}" href="${site + l.slug}">`)
        .concat(`<link rel="alternate" hreflang="x-default" href="${site}">`)
        .join('\n    ');

    // One option of a segmented script switcher (a radio button styled as a segment).
    const segment = (side, script) => {
        const checked = (side === 'from' ? from : to) === script;
        const beta = side === 'to' && EXPERIMENTAL.includes(script)
            ? `<span class="seg-beta">${e(t('beta'))}</span>` : '';
        return `<label class="btn-check btn-text btn-sm seg" title="${e(t('full.' + script))}"><input type="radio" name="${side}" value="${script}"${checked ? ' checked' : ''}>${e(t('name.' + script))}${beta}</label>`;
    };

    const scriptList = scripts.map(script => `
                    <li class="script-item">
                        <div class="d-flex align-items-baseline justify-content-between gap-3">
                            <h4 class="fs-sm fw-semibold mb-0">${e(t('full.' + script))}</h4>
                            <span class="fs-xs fg-3 text-nowrap">${e(t('years.' + script))}</span>
                        </div>
                        <p class="script-sample" lang="${LANG_TAGS[script]}" dir="${scriptDir(script)}">${e(convert('Oʻzbekiston', 'latin', script))}</p>
                        <p class="fs-sm fg-2 mb-0">${e(t('desc.' + script))}${EXPERIMENTAL.includes(script) ? ` <span class="seg-beta">${e(t('beta'))}</span>` : ''}</p>
                    </li>`).join('');

    const alphabetHead = ALPHABET_COLUMNS.map(s => `<th scope="col">${e(t('name.' + s))}</th>`).join('');
    const alphabetBody = ALPHABET.map(cells => '<tr>' + cells.map((text, i) => {
        const script = ALPHABET_COLUMNS[i];
        const attrs = [`lang="${LANG_TAGS[script]}"`];
        const cls = [];
        if (script === 'arabic') { attrs.push('dir="rtl"'); cls.push('arabic'); }
        if (script === 'latin2026' && text !== cells[1]) { cls.push('changed'); }
        if (cls.length) { attrs.push(`class="${cls.join(' ')}"`); }
        return i === 0 ? `<th scope="row" ${attrs.join(' ')}>${e(text)}</th>` : `<td ${attrs.join(' ')}>${e(text)}</td>`;
    }).join('') + '</tr>').join('\n                                ');

    const guideItem = (key, body) => `
                <details class="accordion-item" name="guide">
                    <summary class="accordion-header">${e(t(key + '.title'))}${ACCORDION_ICON}</summary>
                    <div class="accordion-body">${body}</div>
                </details>`;

    const langMenu = locales.map(l => {
        const current = l.id === locale.id;
        return `<a class="menu-item${current ? ' selected' : ''}" href="${root}${l.slug}" lang="${l.lang}" dir="${l.dir || 'ltr'}" data-locale="${l.id}"${current ? ' aria-current="page"' : ''}>${e(l.autonym)}</a>`;
    }).join('\n            ');

    const clientData = {
        locale: locale.id,
        plural: locale.plural,
        root,
        version,
        from,
        to,
        sample: SAMPLE_LATIN,
        strings: Object.fromEntries(Object.entries(locale.strings).filter(([k]) => CLIENT_KEYS.test(k)))
    };

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: t('brand'),
        alternateName: t('title'),
        description: t('meta.description'),
        url,
        inLanguage: locale.lang,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        provider: { '@type': 'Organization', name: PROVIDER.name, url: PROVIDER.url },
        author: { '@type': 'Person', name: AUTHOR, url: 'https://github.com/otabekoff' },
        copyrightHolder: { '@type': 'Person', name: AUTHOR },
        copyrightYear: 2026,
        license: 'https://opensource.org/licenses/MIT'
    };

    // "Provided by MohirLab": the name stays in Latin letters and links to mohirlab.uz.
    const providerLink = `<a href="${PROVIDER.url}" lang="en" dir="ltr">${PROVIDER.name}</a>`;
    const provider = e(t('footer.provider')).replace('{org}', providerLink);

    const json = obj => JSON.stringify(obj).replace(/</g, '\\u003c');

    // On the root page only: send a returning visitor to the interface language they picked before.
    const redirect = locale.slug ? '' : `
    <script>
        try {
            var saved = JSON.parse(localStorage.getItem('uzbek-transliterator') || '{}').locale;
            var paths = ${json(Object.fromEntries(locales.map(l => [l.id, l.slug])))};
            if (saved && saved !== 'uz' && paths[saved] !== undefined) { location.replace(paths[saved]); }
        } catch (e) {}
    </script>`;

    return `<!doctype html>
<html lang="${locale.lang}" dir="${dir}" data-locale="${locale.id}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>${e(t('meta.title'))}</title>
    <meta name="description" content="${e(t('meta.description'))}">
    <link rel="canonical" href="${url}">
    ${alternates}
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Uzbek Transliterator">
    <meta property="og:title" content="${e(t('meta.title'))}">
    <meta property="og:description" content="${e(t('meta.description'))}">
    <meta property="og:url" content="${url}">
    <meta property="og:locale" content="${locale.ogLocale}">
    <meta property="og:image" content="${site}assets/images/icon-512.png">
    <meta name="twitter:card" content="summary">
    <meta name="theme-color" content="#0099b5">
    <link rel="icon" href="${root}assets/images/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="${root}assets/images/icon-180.png">
    <link rel="manifest" href="${root}manifest.webmanifest">
    <script>
        // Apply a saved light/dark choice before the first paint; "auto" follows the system.
        try {
            var theme = JSON.parse(localStorage.getItem('uzbek-transliterator') || '{}').theme;
            if (theme === 'light' || theme === 'dark') { document.documentElement.setAttribute('data-bs-theme', theme); }
        } catch (e) {}
    </script>${redirect}
    <link rel="stylesheet" href="${root}assets/vendor/bootstrap/bootstrap.min.css">
    <link rel="stylesheet" href="${root}assets/styles/main.css?v=${version}">
    <script type="application/ld+json">${json(jsonLd)}</script>
</head>
<body class="app">
<a class="visually-hidden-focusable skip-link" href="#source">${e(t('skip'))}</a>
${icons}

<header class="app-header">
    <a class="app-brand" href="${root}${locale.slug}" aria-label="${e(t('brand'))}">
        <img src="${root}assets/images/favicon.svg" width="22" height="22" alt="">
        <span class="app-brand-name">${e(t('brand'))}</span>
    </a>
    <h1 class="app-title">${e(t('title'))}</h1>

    <div class="app-actions">
        <button type="button" class="btn-text btn-sm" data-bs-toggle="drawer" data-bs-target="#guide" aria-controls="guide">
            ${icon('book')}<span class="d-none md:d-inline">${e(t('guide.title'))}</span>
        </button>

        <button type="button" class="btn-text btn-sm" id="install" hidden>${icon('box-arrow-down')}<span class="d-none md:d-inline">${e(t('nav.install'))}</span></button>

        <button type="button" class="btn-text btn-sm" data-bs-toggle="menu" aria-expanded="false" aria-label="${e(t('nav.language'))}">
            ${icon('globe2')}<span class="d-none sm:d-inline">${e(locale.autonym)}</span>
        </button>
        <div class="menu" id="lang-menu">
            ${langMenu}
        </div>

        <button type="button" class="btn-icon btn-text btn-sm" data-bs-toggle="menu" aria-expanded="false" aria-label="${e(t('nav.theme'))}">
            <svg class="bi" aria-hidden="true"><use id="theme-icon" href="#i-circle-half"></use></svg>
        </button>
        <div class="menu">
            <button type="button" class="menu-item" data-theme-value="light">${icon('sun-fill')}${e(t('theme.light'))}</button>
            <button type="button" class="menu-item" data-theme-value="dark">${icon('moon-stars-fill')}${e(t('theme.dark'))}</button>
            <button type="button" class="menu-item" data-theme-value="auto">${icon('circle-half')}${e(t('theme.auto'))}</button>
        </div>

        <a class="btn-icon btn-text btn-sm d-none sm:d-inline-flex" href="${REPO}" aria-label="GitHub">${icon('github')}</a>
    </div>
</header>

<main id="main" class="app-main">
    <section class="workspace" aria-label="${e(t('title'))}">
        <div class="pane" id="source-pane">
            <div class="pane-head">
                <div class="segmented" role="radiogroup" aria-label="${e(t('from'))}">
                    ${sourceScripts.map(s => segment('from', s)).join('\n                    ')}
                </div>
            </div>
            <label for="source" id="source-label" class="visually-hidden">${e(t('full.' + from))}</label>
            <textarea id="source" class="pane-text" dir="ltr" lang="${LANG_TAGS[from]}"
                      spellcheck="false" autocapitalize="off" autocomplete="off" autofocus
                      placeholder="${e(t('placeholder.' + from))}"></textarea>
            <div class="pane-foot">
                <span class="pane-count" id="source-count"></span>
                <span class="pane-tools">
                    <button type="button" id="sample" class="btn-icon btn-text btn-sm" data-bs-toggle="tooltip" title="${e(t('sample'))}" aria-label="${e(t('sample'))}">${icon('file-earmark-text')}</button>
                    <button type="button" id="upload" class="btn-icon btn-text btn-sm" data-bs-toggle="tooltip" title="${e(t('upload'))}" aria-label="${e(t('upload'))}">${icon('upload')}</button>
                    <button type="button" id="clear" class="btn-icon btn-text btn-sm" data-bs-toggle="tooltip" title="${e(t('clear'))}" aria-label="${e(t('clear'))}">${icon('x-lg')}</button>
                </span>
                <input type="file" id="file" accept=".txt,text/plain" hidden>
            </div>
        </div>

        <div class="swap-wrap">
            <button type="button" id="swap" class="btn-icon btn-sm swap" data-bs-toggle="tooltip" title="${e(t('swap'))}" aria-label="${e(t('swap'))}"${sourceScripts.includes(to) ? '' : ' disabled'}>${icon('arrow-left-right')}</button>
        </div>

        <div class="pane pane-target">
            <div class="pane-head">
                <div class="segmented" role="radiogroup" aria-label="${e(t('to'))}">
                    ${scripts.map(s => segment('to', s)).join('\n                    ')}
                </div>
            </div>
            <p class="experimental" id="experimental"${EXPERIMENTAL.includes(to) ? '' : ' hidden'}>${icon('info-circle')}<span id="experimental-text">${EXPERIMENTAL.includes(to) ? e(t('exp.' + to)) : ''}</span></p>
            <label for="target" id="target-label" class="visually-hidden">${e(t('full.' + to))}</label>
            <textarea id="target" class="pane-text${to === 'arabic' ? ' arabic' : ''}" readonly
                      dir="${scriptDir(to)}" lang="${LANG_TAGS[to]}"></textarea>
            <div class="pane-foot">
                <span class="pane-count" id="target-count"></span>
                <span class="pane-tools">
                    <button type="button" id="download" class="btn-icon btn-text btn-sm" data-bs-toggle="tooltip" title="${e(t('download'))}" aria-label="${e(t('download'))}">${icon('download')}</button>
                    <button type="button" id="copy" class="btn-solid theme-primary btn-sm">
                        <svg class="bi" aria-hidden="true"><use id="copy-icon" href="#i-clipboard"></use></svg><span>${e(t('copy'))}</span>
                    </button>
                </span>
            </div>
        </div>
    </section>
</main>

<footer class="app-status">
    <span class="app-status-note">${icon('shield-lock')}${e(t('footer.privacy'))}</span>
    <span class="app-status-links">
        <span class="app-status-provider">${provider}</span>
        <a href="${REPO}/issues">${e(t('footer.report'))}</a>
        <a href="${REPO}">${e(t('footer.source'))}</a>
        <span lang="en" dir="ltr">© 2026 ${AUTHOR} · <a href="${REPO}/blob/main/LICENSE">MIT</a></span>
    </span>
</footer>

<dialog class="drawer drawer-end guide-drawer" id="guide" aria-labelledby="guide-title">
    <div class="drawer-header">
        <h2 class="drawer-title" id="guide-title">${e(t('guide.title'))}</h2>
        <button type="button" class="btn-close" data-bs-dismiss="drawer" aria-label="${e(t('close'))}"></button>
    </div>
    <div class="drawer-body">
        <p class="guide-lead">${e(t('lead'))}</p>

        <section aria-labelledby="scripts-title">
            <h3 class="guide-heading" id="scripts-title">${e(t('scripts.title'))}</h3>
            <ul class="script-list">${scriptList}
            </ul>
        </section>

        <div class="accordion accordion-sm">${guideItem('alphabet', `
                    <div class="table-responsive">
                        <table class="table table-sm alphabet-table">
                            <thead><tr>${alphabetHead}</tr></thead>
                            <tbody>
                                ${alphabetBody}
                            </tbody>
                        </table>
                    </div>
                    <p class="fs-sm fg-3 mb-0">${e(t('alphabet.note'))}</p>`)}${guideItem('rules', `<div class="prose-sm">${t('rules.body')}</div>`)}${guideItem('privacy', `<p class="mb-0">${e(t('privacy.body'))}</p>`)}${guideItem('dev', `
                    <p>${t('dev.body')}</p>
                    <pre class="code-sample mb-0" dir="ltr"><code>&lt;script src="translit.js"&gt;&lt;/script&gt;
&lt;script&gt;
  Translit.convert("Oʻzbekiston", "latin", "latin2026");  // "Özbekiston"
  Translit.convert("Тошкент", "cyrillic", "latin");       // "Toshkent"
&lt;/script&gt;</code></pre>`)}
        </div>
    </div>
</dialog>

<div class="toast-container toast-dock">
    <div id="toast" class="toast" role="status" aria-live="polite" aria-atomic="true">
        <div class="toast-body" id="toast-text"></div>
    </div>
</div>

<script type="application/json" id="page-data">${json(clientData)}</script>
<script src="${root}assets/scripts/translit.js?v=${version}"></script>
<script type="module" src="${root}assets/scripts/main.js?v=${version}"></script>
</body>
</html>
`;
}
