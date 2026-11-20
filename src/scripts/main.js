// Page behaviour. The HTML is pre-rendered per language by build/build.mjs; this module only
// wires it up. Translit comes from translit.js (a classic script loaded before this module).
import { Toast } from '../vendor/bootstrap/bootstrap.bundle.min.js';

const STORAGE_KEY = 'uzbek-transliterator';
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const EXPERIMENTAL = ['arabic', 'yanalif'];
const LANG_TAGS = { latin: 'uz-Latn', latin2026: 'uz-Latn', cyrillic: 'uz-Cyrl', arabic: 'uz-Arab', yanalif: 'uz-Latn' };
const THEME_ICONS = { light: '#i-sun-fill', dark: '#i-moon-stars-fill', auto: '#i-circle-half' };

const { SOURCE_SCRIPTS, convert } = window.Translit;
const page = JSON.parse(document.getElementById('page-data').textContent);
const strings = page.strings;
const $ = id => document.getElementById(id);
const source = $('source');
const target = $('target');
const toast = Toast.getOrCreateInstance($('toast'), { delay: 2500 });
const plural = new Intl.PluralRules(page.plural);

// --- saved state: the text and theme are shared, the script pair is kept per language ---

let saved = {};
try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
} catch (e) { /* storage unavailable or corrupt */ }

const pair = (saved.pairs && saved.pairs[page.locale]) || {};
const state = {
    from: SOURCE_SCRIPTS.includes(pair.from) ? pair.from : page.from,
    to: pair.to && pair.to !== pair.from && window.Translit.SCRIPTS.includes(pair.to) ? pair.to : page.to,
    theme: ['light', 'dark', 'auto'].includes(saved.theme) ? saved.theme : 'auto'
};
if (state.from === state.to) {
    state.from = page.from;
    state.to = page.to;
}

function save(extra) {
    saved = Object.assign(saved, extra || {});
    saved.text = source.value;
    saved.theme = state.theme;
    saved.pairs = Object.assign(saved.pairs || {}, { [page.locale]: { from: state.from, to: state.to } });
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch (e) { /* storage unavailable or full */ }
}

// --- rendering ---------------------------------------------------------------------

function count(text) {
    const words = text.match(/[\p{L}\p{N}]+(?:['’‘ʻʼ`-][\p{L}\p{N}]+)*/gu);
    const n = words ? words.length : 0;
    const c = Array.from(text).length;
    const pick = (kind, value) => (strings[kind + '.' + plural.select(value)] || strings[kind + '.other']).replace('{n}', value.toLocaleString(page.plural));
    return pick('words', n) + ' · ' + pick('chars', c);
}

// On narrow screens the switchers scroll sideways: keep the selected segment in view
// (scrolling only the switcher, never the page).
function revealSegment(seg) {
    const track = seg.parentElement;
    const segBox = seg.getBoundingClientRect();
    const trackBox = track.getBoundingClientRect();
    if (segBox.left < trackBox.left) {
        track.scrollLeft -= trackBox.left - segBox.left + 8;
    } else if (segBox.right > trackBox.right) {
        track.scrollLeft += segBox.right - trackBox.right + 8;
    }
}

// Also after rotating a phone or resizing the window.
window.addEventListener('resize', () => {
    document.querySelectorAll('.segmented input:checked').forEach(input => revealSegment(input.closest('.seg')));
});

function render() {
    // Segmented switchers: radio inputs named "from" and "to".
    document.querySelectorAll('.segmented input').forEach(input => {
        input.checked = input.value === state[input.name];
        if (input.checked) { revealSegment(input.closest('.seg')); }
    });

    $('source-label').textContent = strings['full.' + state.from];
    $('target-label').textContent = strings['full.' + state.to];
    source.placeholder = strings['placeholder.' + state.from];
    source.lang = LANG_TAGS[state.from];
    target.lang = LANG_TAGS[state.to];
    target.dir = state.to === 'arabic' ? 'rtl' : 'ltr';
    target.classList.toggle('arabic', state.to === 'arabic');

    const experimental = EXPERIMENTAL.includes(state.to);
    $('experimental').hidden = !experimental;
    $('experimental-text').textContent = experimental ? strings['exp.' + state.to] : '';
    $('swap').disabled = !SOURCE_SCRIPTS.includes(state.to);

    target.value = convert(source.value, state.from, state.to);
    $('source-count').textContent = count(source.value);
    $('target-count').textContent = count(target.value);
}

function notify(key) {
    $('toast-text').textContent = strings['toast.' + key];
    toast.show();
}

// --- actions -------------------------------------------------------------------------

// Swap sides and keep working on the converted text.
function swap() {
    if (!SOURCE_SCRIPTS.includes(state.to)) { return; }
    source.value = target.value;
    [state.from, state.to] = [state.to, state.from];
    render();
    save();
}

function choose(side, script) {
    if (state[side] === script) { return; }
    const other = side === 'from' ? 'to' : 'from';
    if (state[other] === script) {
        if (SOURCE_SCRIPTS.includes(state.to)) {
            swap(); // picking the other side's script swaps the sides
            return;
        }
        // The target is Arabic or Yanalif and the source script was picked as the target:
        // move the source to another script and rewrite the text in it.
        const newFrom = SOURCE_SCRIPTS.find(s => s !== script);
        source.value = convert(source.value, state.from, newFrom);
        state.from = newFrom;
    }
    state[side] = script;
    render();
    save();
}

function applyTheme(theme) {
    state.theme = theme;
    if (theme === 'auto') {
        document.documentElement.removeAttribute('data-bs-theme'); // follow the system
    } else {
        document.documentElement.setAttribute('data-bs-theme', theme);
    }
    $('theme-icon').setAttribute('href', THEME_ICONS[theme]);
    document.querySelectorAll('[data-theme-value]').forEach(item => {
        const current = item.dataset.themeValue === theme;
        item.classList.toggle('selected', current);
        item.setAttribute('aria-pressed', String(current));
    });
}

function readFile(file) {
    if (!file) { return; }
    if (file.size > MAX_FILE_BYTES) { notify('tooBig'); return; }
    if (file.type && !file.type.startsWith('text/')) { notify('notText'); return; }
    file.text().then(text => {
        source.value = text;
        render();
        save();
        notify('loaded');
    });
}

async function copyResult() {
    if (!target.value) { notify('empty'); return; }
    try {
        await navigator.clipboard.writeText(target.value);
    } catch (e) {
        target.select();
        if (!document.execCommand('copy')) { notify('copyFailed'); return; }
    }
    notify('copied');
    $('copy-icon').setAttribute('href', '#i-clipboard-check');
    setTimeout(() => $('copy-icon').setAttribute('href', '#i-clipboard'), 1500);
}

function downloadResult() {
    if (!target.value) { notify('empty'); return; }
    const url = URL.createObjectURL(new Blob([target.value], { type: 'text/plain;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `matn-${state.to}.txt` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('saved');
}

// --- events ----------------------------------------------------------------------------

source.addEventListener('input', () => { render(); save(); });

document.querySelectorAll('.segmented input').forEach(input => {
    input.addEventListener('change', () => choose(input.name, input.value));
});

$('swap').addEventListener('click', () => { swap(); source.focus(); });
$('sample').addEventListener('click', () => {
    source.value = convert(page.sample, 'latin', state.from);
    render();
    save();
});
$('clear').addEventListener('click', () => {
    source.value = '';
    render();
    save();
    source.focus();
});
$('copy').addEventListener('click', copyResult);
$('download').addEventListener('click', downloadResult);
$('upload').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', event => {
    readFile(event.target.files[0]);
    event.target.value = '';
});

const pane = $('source-pane');
const hasFiles = e => e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');
pane.addEventListener('dragover', e => {
    if (!hasFiles(e)) { return; } // plain text drops go into the textarea as usual
    e.preventDefault();
    pane.classList.add('dragging');
});
pane.addEventListener('dragleave', () => pane.classList.remove('dragging'));
pane.addEventListener('drop', e => {
    pane.classList.remove('dragging');
    if (!hasFiles(e)) { return; }
    e.preventDefault();
    readFile(e.dataTransfer.files[0]);
});

// Remember the chosen interface language (the root page redirects to it next time).
document.querySelectorAll('#lang-menu [data-locale]').forEach(link => {
    link.addEventListener('click', () => save({ locale: link.dataset.locale }));
});

document.querySelectorAll('[data-theme-value]').forEach(item => {
    item.addEventListener('click', () => { applyTheme(item.dataset.themeValue); save(); });
});

// --- installable app and offline use -----------------------------------------------------

let installPrompt = null;
window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    $('install').hidden = false;
});
$('install').addEventListener('click', async () => {
    if (!installPrompt) { return; }
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    $('install').hidden = true;
});
window.addEventListener('appinstalled', () => { $('install').hidden = true; });

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    const firstInstall = !navigator.serviceWorker.controller;
    navigator.serviceWorker.register(page.root + 'sw.js').then(registration => {
        const worker = registration.installing;
        if (firstInstall && worker) {
            worker.addEventListener('statechange', () => {
                if (worker.state === 'activated') { notify('offline'); }
            });
        }
    }).catch(() => { /* offline support is optional */ });
}

// --- start ---------------------------------------------------------------------------------

source.value = typeof saved.text === 'string' ? saved.text : '';
applyTheme(state.theme);
render();
