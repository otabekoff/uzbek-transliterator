/* Page behaviour. Needs bootstrap.bundle.min.js and translit.js loaded first. */
(function () {
    'use strict';

    var STORAGE_KEY = 'uzbek-transliterator';
    var MAX_FILE_BYTES = 2 * 1024 * 1024;

    var SAMPLE_LATIN = 'Oʻzbekiston Respublikasi — Markaziy Osiyodagi davlat. Poytaxti — Toshkent shahri.\n' +
        'Ertaga yoʻlga chiqsak, kechqurun yetib boramiz. Maʼno-mazmuni aniq boʻlsin!';

    // [Latin, Cyrillic] pairs shown in the alphabet panel.
    var ALPHABET = [
        ['A a', 'А а'], ['B b', 'Б б'], ['D d', 'Д д'], ['E e', 'Е е · Э э'], ['F f', 'Ф ф'],
        ['G g', 'Г г'], ['H h', 'Ҳ ҳ'], ['I i', 'И и'], ['J j', 'Ж ж'], ['K k', 'К к'],
        ['L l', 'Л л'], ['M m', 'М м'], ['N n', 'Н н'], ['O o', 'О о'], ['P p', 'П п'],
        ['Q q', 'Қ қ'], ['R r', 'Р р'], ['S s', 'С с'], ['T t', 'Т т'], ['U u', 'У у'],
        ['V v', 'В в'], ['X x', 'Х х'], ['Y y', 'Й й'], ['Z z', 'З з'], ['Oʻ oʻ', 'Ў ў'],
        ['Gʻ gʻ', 'Ғ ғ'], ['Sh sh', 'Ш ш'], ['Ch ch', 'Ч ч'], ['Yo yo', 'Ё ё'], ['Yu yu', 'Ю ю'],
        ['Ya ya', 'Я я'], ['Ye ye', 'Е е'], ['Ts ts', 'Ц ц'], ['ʼ', 'ъ']
    ];

    var I18N = {
        uz: {
            lead: 'Oʻzbekcha matnni lotin va kirill alifbolari orasida bir zumda oʻgiring.',
            badgePrivate: 'Matn hech qayerga yuborilmaydi',
            badgeLive: 'Yozish bilan oʻgiriladi',
            badgeOpen: 'Ochiq kodli',
            direction: 'Yoʻnalish',
            modeLat2Cyr: 'Lotin → Кирилл',
            modeCyr2Lat: 'Кирилл → Lotin',
            latin: 'Lotin',
            cyrillic: 'Кирилл',
            placeholderLatin: 'Matnni shu yerga yozing yoki qoʻying…',
            placeholderCyrillic: 'Матнни шу ерга ёзинг ёки қўйинг…',
            sample: 'Namuna',
            upload: 'Fayl ochish',
            uploadHint: '.txt faylni oching yoki maydonga tashlang',
            download: '.txt sifatida yuklab olish',
            copy: 'Nusxa olish',
            clear: 'Tozalash',
            swap: 'Yoʻnalishni almashtirish',
            theme: 'Mavzu',
            themeLight: 'Yorugʻ',
            themeDark: 'Qorongʻi',
            themeAuto: 'Avtomatik',
            count: function (w, c) { return w + ' soʻz · ' + c + ' belgi'; },
            copied: 'Nusxa olindi',
            copyFailed: 'Nusxa olib boʻlmadi',
            empty: 'Natija boʻsh',
            saved: 'Fayl saqlandi',
            loaded: 'Fayl ochildi',
            tooBig: 'Fayl juda katta (2 MB gacha)',
            notText: 'Faqat .txt matn fayllari',
            guideTitle: 'Qoʻllanma',
            alphabetTitle: 'Alifbo',
            alphabetNote: 'E harfi soʻz boshida va unlidan keyin Э boʻladi. Ts oʻzlashma soʻzlarda Ц, qoʻshimcha oldidan ТС boʻladi.',
            rulesTitle: 'Oʻgirish qoidalari',
            rulesBody: '<ul class="mb-0">' +
                '<li><code>oʻ gʻ</code> → <code>ў ғ</code>, tutuq belgisi <code>ʼ</code> → <code>ъ</code>. Apostrofning hamma shakli tushuniladi: <code>\' ’ ‘ ʻ ʼ</code>. Qoʻshtirnoq ichidagi soʻz oʻzgarmaydi.</li>' +
                '<li><code>e</code> soʻz boshida va unlidan keyin <code>э</code>: erkin → эркин, aeroport → аэропорт.</li>' +
                '<li><code>yo yu ya ye</code> → <code>ё ю я е</code>, lekin yoʻl → йўл.</li>' +
                '<li><code>ts</code> oʻzlashma soʻzlarda <code>ц</code> (tsirk → цирк, stantsiya → станция), qoʻshimcha oldidan <code>тс</code> (ketsa → кетса, sifatsiz → сифатсиз). Bu taxminiy qoida, kam uchraydigan soʻzlarda xato boʻlishi mumkin.</li>' +
                '<li><code>sʼh</code> → <code>сҳ</code>: Isʼhoq → Исҳоқ.</li>' +
                '<li>Kirilldan lotinga 1995-yilgi rasmiy qoidalar boʻyicha: <code>е</code> soʻz boshida va unlidan keyin <code>ye</code>; <code>ц</code> unlidan keyin <code>ts</code>, boshqa joyda <code>s</code>; <code>ь</code> tushib qoladi.</li>' +
                '<li>Katta harflar saqlanadi: Shahar → Шаҳар, SHAHAR → ШАҲАР.</li>' +
                '</ul>',
            privacyTitle: 'Maxfiylik',
            privacyBody: 'Oʻgirish toʻliq brauzeringizda bajariladi, matn hech qanday serverga yuborilmaydi. ' +
                'Keyingi safar davom ettirishingiz uchun oxirgi matn faqat shu qurilmada (localStorage) saqlanadi; «Tozalash» uni oʻchiradi.',
            devTitle: 'Dasturchilar uchun',
            devBody: '<code>assets/scripts/translit.js</code> hech narsaga bogʻliq emas. Uni loyihangizga koʻchiring va ishlating (Node.js da <code>require()</code> bilan ham ishlaydi):',
            reportBug: 'Xato topdingizmi?'
        },
        en: {
            lead: 'Convert Uzbek text between the Latin and Cyrillic alphabets instantly.',
            badgePrivate: 'Your text never leaves the browser',
            badgeLive: 'Converts as you type',
            badgeOpen: 'Open source',
            direction: 'Direction',
            modeLat2Cyr: 'Latin → Cyrillic',
            modeCyr2Lat: 'Cyrillic → Latin',
            latin: 'Latin',
            cyrillic: 'Cyrillic',
            placeholderLatin: 'Type or paste Latin text here…',
            placeholderCyrillic: 'Type or paste Cyrillic text here…',
            sample: 'Sample',
            upload: 'Open file',
            uploadHint: 'Open a .txt file or drop it on the input',
            download: 'Download as .txt',
            copy: 'Copy',
            clear: 'Clear',
            swap: 'Swap direction',
            theme: 'Theme',
            themeLight: 'Light',
            themeDark: 'Dark',
            themeAuto: 'Auto',
            count: function (w, c) { return w + (w === 1 ? ' word' : ' words') + ' · ' + c + (c === 1 ? ' character' : ' characters'); },
            copied: 'Copied',
            copyFailed: 'Could not copy',
            empty: 'Nothing to save yet',
            saved: 'File saved',
            loaded: 'File opened',
            tooBig: 'File is too large (2 MB max)',
            notText: 'Only plain .txt files',
            guideTitle: 'Guide',
            alphabetTitle: 'Alphabet',
            alphabetNote: 'E becomes Э at the start of a word and after a vowel. Ts becomes Ц in loanwords and ТС before a suffix.',
            rulesTitle: 'Conversion rules',
            rulesBody: '<ul class="mb-0">' +
                '<li><code>oʻ gʻ</code> → <code>ў ғ</code>, and the apostrophe on its own <code>ʼ</code> → <code>ъ</code>. Every apostrophe form works: <code>\' ’ ‘ ʻ ʼ</code>. Words inside quotation marks are left alone.</li>' +
                '<li><code>e</code> → <code>э</code> at the start of a word and after a vowel: erkin → эркин, aeroport → аэропорт.</li>' +
                '<li><code>yo yu ya ye</code> → <code>ё ю я е</code>, but yoʻl → йўл.</li>' +
                '<li><code>ts</code> → <code>ц</code> in loanwords (tsirk → цирк, stantsiya → станция) and <code>тс</code> before a suffix (ketsa → кетса, sifatsiz → сифатсиз). This is a rule of thumb, so rare words can come out wrong.</li>' +
                '<li><code>sʼh</code> → <code>сҳ</code>: Isʼhoq → Исҳоқ.</li>' +
                '<li>Cyrillic → Latin follows the official 1995 rules: <code>е</code> → <code>ye</code> at the start of a word and after a vowel; <code>ц</code> → <code>ts</code> after a vowel and <code>s</code> elsewhere; <code>ь</code> is dropped.</li>' +
                '<li>Capitals are kept: Shahar → Шаҳар, SHAHAR → ШАҲАР.</li>' +
                '</ul>',
            privacyTitle: 'Privacy',
            privacyBody: 'Conversion runs entirely in your browser; your text is never sent to any server. ' +
                'The last text is kept only on this device (localStorage) so you can continue next time; Clear removes it.',
            devTitle: 'For developers',
            devBody: '<code>assets/scripts/translit.js</code> has no dependencies. Copy it into your project and use it (it also works in Node.js with <code>require()</code>):',
            reportBug: 'Found a mistake?'
        }
    };

    var MODES = {
        lat2cyr: { convert: Translit.latinToCyrillic, from: 'latin', to: 'cyrillic', file: 'matn-kirill.txt' },
        cyr2lat: { convert: Translit.cyrillicToLatin, from: 'cyrillic', to: 'latin', file: 'matn-lotin.txt' }
    };
    var THEME_ICONS = { light: '#i-sun-fill', dark: '#i-moon-stars-fill', auto: '#i-circle-half' };

    var $ = function (id) { return document.getElementById(id); };
    var source = $('source');
    var target = $('target');
    var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    var toast = bootstrap.Toast.getOrCreateInstance($('toast'), { delay: 2000 });
    var state = { mode: 'lat2cyr', text: '', theme: 'auto', lang: 'uz' };

    function t(key) {
        return I18N[state.lang][key];
    }

    function load() {
        try {
            var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            if (MODES[saved.mode]) { state.mode = saved.mode; }
            if (THEME_ICONS[saved.theme]) { state.theme = saved.theme; }
            if (I18N[saved.lang]) {
                state.lang = saved.lang;
            } else if (!/^uz\b/i.test(navigator.language || 'uz') && !/^ru\b/i.test(navigator.language)) {
                state.lang = 'en';
            }
            if (typeof saved.text === 'string') { state.text = saved.text; }
        } catch (e) { /* storage unavailable or corrupt: use defaults */ }
    }

    function save() {
        state.text = source.value;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) { /* storage unavailable or full */ }
    }

    function notify(key) {
        $('toast-text').textContent = t(key);
        toast.show();
    }

    function countText(text) {
        var words = text.match(/[\p{L}\p{N}]+(?:['’‘ʻʼ`-][\p{L}\p{N}]+)*/gu);
        return t('count')(words ? words.length : 0, Array.from(text).length);
    }

    function render() {
        var mode = MODES[state.mode];
        $('source-label').textContent = t(mode.from);
        $('target-label').textContent = t(mode.to);
        source.placeholder = t(mode.from === 'latin' ? 'placeholderLatin' : 'placeholderCyrillic');
        target.value = mode.convert(source.value);
        $('source-count').textContent = countText(source.value);
        $('target-count').textContent = countText(target.value);
        $('mode-' + state.mode).checked = true;
    }

    function setMode(mode) {
        if (mode === state.mode) { return; }
        source.value = target.value; // keep working on the converted text
        state.mode = mode;
        render();
        save();
    }

    function applyTheme(theme) {
        state.theme = theme;
        var resolved = theme === 'auto' ? (darkQuery.matches ? 'dark' : 'light') : theme;
        document.documentElement.setAttribute('data-bs-theme', resolved);
        $('theme-icon').setAttribute('href', THEME_ICONS[theme]);
        document.querySelectorAll('[data-theme-value]').forEach(function (el) {
            var active = el.getAttribute('data-theme-value') === theme;
            el.classList.toggle('active', active);
            el.setAttribute('aria-pressed', String(active));
        });
    }

    function applyLang(lang) {
        state.lang = lang;
        document.documentElement.lang = lang;
        $('lang-' + lang).checked = true;
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            el.textContent = t(el.getAttribute('data-i18n'));
        });
        // Only our own static strings above go through innerHTML.
        document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
            el.innerHTML = t(el.getAttribute('data-i18n-html'));
        });
        document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
            el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
        });
        document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
            var text = t(el.getAttribute('data-i18n-title'));
            el.setAttribute('aria-label', text);
            var tip = bootstrap.Tooltip.getInstance(el);
            if (tip) {
                tip.setContent({ '.tooltip-inner': text });
            } else {
                el.setAttribute('data-bs-title', text);
                new bootstrap.Tooltip(el);
            }
        });
        render();
    }

    function buildAlphabet() {
        var html = '';
        ALPHABET.forEach(function (pair) {
            html += '<div class="col"><div class="letter-tile border rounded-3 px-2 py-2 text-center h-100">' +
                '<span class="fw-semibold">' + pair[0] + '</span>' +
                '<span class="text-body-tertiary mx-1">→</span>' +
                '<span class="fw-semibold text-primary">' + pair[1] + '</span></div></div>';
        });
        $('alphabet').innerHTML = html; // static table defined above
    }

    function readFile(file) {
        if (!file) { return; }
        if (file.size > MAX_FILE_BYTES) { notify('tooBig'); return; }
        if (file.type && file.type.indexOf('text/') !== 0) { notify('notText'); return; }
        file.text().then(function (text) {
            source.value = text;
            render();
            save();
            notify('loaded');
        });
    }

    function copyResult() {
        var text = target.value;
        if (!text) { notify('empty'); return; }
        var done = function () {
            notify('copied');
            $('copy-icon').setAttribute('href', '#i-clipboard-check');
            setTimeout(function () { $('copy-icon').setAttribute('href', '#i-clipboard'); }, 1500);
        };
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(done, function () { notify('copyFailed'); });
        } else {
            target.select();
            if (document.execCommand('copy')) { done(); } else { notify('copyFailed'); }
        }
    }

    function downloadResult() {
        if (!target.value) { notify('empty'); return; }
        var url = URL.createObjectURL(new Blob([target.value], { type: 'text/plain;charset=utf-8' }));
        var a = document.createElement('a');
        a.href = url;
        a.download = MODES[state.mode].file;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        notify('saved');
    }

    // --- events ---------------------------------------------------------

    source.addEventListener('input', function () {
        render();
        save();
    });

    document.querySelectorAll('input[name="mode"]').forEach(function (el) {
        el.addEventListener('change', function () { setMode(el.value); });
    });

    $('swap').addEventListener('click', function () {
        setMode(state.mode === 'lat2cyr' ? 'cyr2lat' : 'lat2cyr');
        source.focus();
    });

    $('sample').addEventListener('click', function () {
        source.value = state.mode === 'lat2cyr' ? SAMPLE_LATIN : Translit.latinToCyrillic(SAMPLE_LATIN);
        render();
        save();
    });

    $('clear').addEventListener('click', function () {
        source.value = '';
        render();
        save();
        source.focus();
    });

    $('copy').addEventListener('click', copyResult);
    $('download').addEventListener('click', downloadResult);

    $('upload').addEventListener('click', function () { $('file').click(); });
    $('file').addEventListener('change', function () {
        readFile(this.files[0]);
        this.value = '';
    });

    var pane = $('source-pane');
    function hasFiles(e) {
        return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') !== -1;
    }
    pane.addEventListener('dragover', function (e) {
        if (!hasFiles(e)) { return; } // let plain text drops through
        e.preventDefault();
        pane.classList.add('dragging');
    });
    pane.addEventListener('dragleave', function () { pane.classList.remove('dragging'); });
    pane.addEventListener('drop', function (e) {
        pane.classList.remove('dragging');
        if (!hasFiles(e)) { return; }
        e.preventDefault();
        readFile(e.dataTransfer.files[0]);
    });

    document.querySelectorAll('input[name="ui-lang"]').forEach(function (el) {
        el.addEventListener('change', function () {
            applyLang(el.value);
            save();
        });
    });

    document.querySelectorAll('[data-theme-value]').forEach(function (el) {
        el.addEventListener('click', function () {
            applyTheme(el.getAttribute('data-theme-value'));
            save();
        });
    });
    darkQuery.addEventListener('change', function () {
        if (state.theme === 'auto') { applyTheme('auto'); }
    });

    // --- start ----------------------------------------------------------

    load();
    source.value = state.text;
    buildAlphabet();
    applyTheme(state.theme);
    applyLang(state.lang);
}());
