// English interface text. Keys match uz.mjs.
export default {
    'meta.title': 'Uzbek Latin ↔ Cyrillic converter · Uzbek Transliterator',
    'meta.description': 'Free converter for Uzbek text between Latin, the new 2026 Latin, Cyrillic, Arabic script and Yanalif. Runs in your browser; your text is never uploaded.',
    brand: 'Uzbek Transliterator',
    skip: 'Skip to main content',
    title: 'Uzbek scripts',
    lead: 'Convert Uzbek text between Latin, new Latin, Cyrillic, Arabic and Yanalif.',

    'nav.language': 'Language',
    'nav.theme': 'Theme',
    'nav.install': 'Install',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.auto': 'System',

    from: 'From script',
    to: 'To script',
    beta: 'beta',

    'name.latin': 'Latin',
    'name.latin2026': 'New Latin',
    'name.cyrillic': 'Cyrillic',
    'name.arabic': 'Arabic',
    'name.yanalif': 'Yanalif',

    'full.latin': 'Latin script (1995)',
    'full.latin2026': 'New Latin script (2026)',
    'full.cyrillic': 'Cyrillic script (1940)',
    'full.arabic': 'Arabic script, Yangi imlo',
    'full.yanalif': 'Yanalif (1934)',

    'years.latin': '1995 – today',
    'years.latin2026': 'from 22 April 2027',
    'years.cyrillic': '1940 – today',
    'years.arabic': 'c. 1921–1928',
    'years.yanalif': '1929–1940',

    'desc.latin': 'The Latin alphabet adopted in 1993 and revised in 1995: the letters Oʻ, Gʻ, Sh, Ch and the tutuq sign ʼ. The main official script until the new law takes effect.',
    'desc.latin2026': 'A law signed on 21 October 2026 replaces Oʻ, Gʻ, Sh, Ch with Ö, Ğ, Ş, Ç: 28 letters plus the tutuq sign ʼ. Ng is no longer a separate letter. In force from 22 April 2027.',
    'desc.cyrillic': 'The Cyrillic alphabet introduced in 1940. Latin has been official since the 1990s, but Cyrillic is still widely used.',
    'desc.arabic': 'The Arabic script as reformed by the Jadids in the 1920s, called Yangi imlo ("new spelling"). Every vowel is written, and letters such as ۉ ې ۇ ۋ ڭ were added for sounds Arabic lacks. Uzbeks in Afghanistan still write in Arabic script.',
    'desc.yanalif': 'Yanalif, the "new alphabet": the unified Latin alphabet for the Turkic peoples of the USSR, 1929–1940. This is the 1934 Uzbek version: ʙ c ç ş ƣ ꞑ j; Cyrillic «о» is written a and «ў» is written o.',

    'exp.arabic': 'Experimental: an approximate conversion following Yangi imlo spelling. Converting from Arabic script is not supported.',
    'exp.yanalif': 'Experimental: an approximate conversion following the 1934 Yanalif. Converting from Yanalif is not supported.',

    'placeholder.latin': 'Type or paste Latin text',
    'placeholder.latin2026': 'Type or paste new Latin text',
    'placeholder.cyrillic': 'Type or paste Cyrillic text',

    sample: 'Sample text',
    upload: 'Open file (.txt)',
    download: 'Download (.txt)',
    copy: 'Copy',
    clear: 'Clear',
    swap: 'Swap direction',

    'words.one': '{n} word',
    'words.other': '{n} words',
    'chars.one': '{n} character',
    'chars.other': '{n} characters',

    'toast.copied': 'Copied',
    'toast.copyFailed': 'Could not copy',
    'toast.empty': 'Nothing to save yet',
    'toast.saved': 'File saved',
    'toast.loaded': 'File opened',
    'toast.tooBig': 'File is too large: 2 MB max',
    'toast.notText': 'Only plain .txt files',
    'toast.offline': 'Now works offline',

    'scripts.title': 'Five scripts',
    'guide.title': 'Guide',

    'alphabet.title': 'Alphabet comparison',
    'alphabet.note': 'Highlighted cells are what changes in the 2026 Latin script. Е is ye at the start of a word and after a vowel; Ц is ts after a vowel and s elsewhere.',

    'rules.title': 'Conversion rules',
    'rules.body': '<ul>' +
        '<li><code>oʻ gʻ</code> → <code>ў ғ</code>, and the tutuq sign <code>ʼ</code> → <code>ъ</code>. Every apostrophe form works: <code>\' ’ ‘ ʻ ʼ</code>. Words inside quotation marks are left alone.</li>' +
        '<li>New Latin: <code>oʻ gʻ sh ch</code> → <code>ö ğ ş ç</code>. <code>sʼh</code> becomes a plain <code>sh</code> (<code>Isʼhoq → Ishoq</code>), since the "sh" sound is now written <code>ş</code>.</li>' +
        '<li><code>e</code> → <code>э</code> at the start of a word and after a vowel: <code>erkin → эркин</code>, <code>aeroport → аэропорт</code>.</li>' +
        '<li><code>yo yu ya ye</code> → <code>ё ю я е</code>, but <code>yoʻl → йўл</code>.</li>' +
        '<li><code>ts</code> → <code>ц</code> in loanwords (<code>tsirk → цирк</code>) and <code>тс</code> before a suffix (<code>ketsa → кетса</code>). This is a rule of thumb.</li>' +
        '<li>Cyrillic → Latin follows the official 1995 rules: <code>ц</code> → <code>ts</code> after a vowel and <code>s</code> elsewhere; <code>ь</code> is dropped.</li>' +
        '<li>In Arabic script a vowel at the start of a word gets <code>ئ</code>; comma and question mark become <code>، ؟</code>.</li>' +
        '<li>Capitals are kept: <code>SHAHAR → ШАҲАР</code>.</li>' +
        '</ul>',

    'privacy.title': 'Privacy and offline use',
    'privacy.body': 'Conversion runs entirely in your browser; your text is never sent to any server. The last text is kept only on this device so you can continue next time, and Clear removes it. After the first visit the page works without internet, and you can install it as an app.',

    'dev.title': 'For developers',
    'dev.body': '<code>src/scripts/translit.js</code> has no dependencies. <code>Translit.convert(text, from, to)</code> handles every script, and it also works in Node.js with <code>require()</code>.',

    'footer.privacy': 'Text is converted in your browser and never uploaded.',
    'footer.report': 'Found a mistake?',
    'footer.source': 'Source code',
    close: 'Close',
    'footer.provider': 'Provided by {org}'
};
