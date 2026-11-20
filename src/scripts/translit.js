/*
 * Uzbek transliteration between five writing systems:
 *
 *   latin      Lotin yozuvi, 1995 alphabet (Oʻ Gʻ Sh Ch)            source + target
 *   latin2026  Yangi lotin yozuvi, 2026 law (Ö Ğ Ş Ç ʼ)             source + target
 *   cyrillic   Kirill yozuvi, 1940 alphabet                         source + target
 *   arabic     Arab yozuvi, Yangi imlo (1920s), experimental        target only
 *   yanalif    Yañalif, 1934–1940 Uzbek version, experimental       target only
 *
 * Latin <-> Latin 2026 is a direct letter swap. Every other pair goes through
 * Cyrillic, which keeps the most distinctions (о/ў, е/э, ц, ъ).
 *
 * Works in the browser (exposes `window.Translit`) and in Node (`require`).
 * Pure functions, no DOM access.
 */
(function (root, factory) {
    var api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        root.Translit = api;
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // Every character people use for the Uzbek apostrophe (tutuq belgisi and
    // the mark in oʻ / gʻ). It only counts as an apostrophe between two
    // letters, so quotation marks such as ‘word’ are left alone.
    var APOSTROPHES = '\'’‘ʻʼ`´';
    var LETTER = /\p{L}/u;

    var LAT_SINGLE = {
        a: 'а', b: 'б', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'ҳ', i: 'и',
        j: 'ж', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', q: 'қ',
        r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', x: 'х', y: 'й', z: 'з'
    };
    var LAT_PAIR = {
        sh: 'ш', ch: 'ч', yo: 'ё', yu: 'ю', ya: 'я', ye: 'е', ts: 'ц'
    };
    // Vowels after which Latin "e" is written "э" (aeroport -> аэропорт).
    var LAT_VOWELS = 'aiou';

    var CYR_VOWELS = 'аеёиоуэюяўы';

    // How each Cyrillic letter is written in the Latin-based scripts.
    // ye: Cyrillic е at the start of a word or after a vowel.
    // sh: Cyrillic с before ҳ (Исҳоқ), where a plain "sh" would be misread.
    // ng: one letter for нг, if the script has one.
    var CYR_BASE = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ё': 'yo',
        'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l',
        'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's',
        'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x', 'ч': 'ch', 'ш': 'sh',
        'щ': 'sh', 'ъ': '\'', 'ь': '', 'ы': 'i', 'э': 'e', 'ю': 'yu',
        'я': 'ya', 'ў': 'o\'', 'қ': 'q', 'ғ': 'g\'', 'ҳ': 'h'
    };

    function extend(base, changes) {
        var out = {};
        Object.keys(base).forEach(function (k) { out[k] = base[k]; });
        Object.keys(changes).forEach(function (k) { out[k] = changes[k]; });
        return out;
    }

    var PROFILES = {
        latin: { map: CYR_BASE, ye: 'ye', sh: 's\'', ng: null },
        // Law of 21 Oct 2026 (in force 22 Apr 2027): Ö Ğ Ş Ç, tutuq written ʼ (U+02BC).
        latin2026: {
            map: extend(CYR_BASE, { 'ч': 'ç', 'ш': 'ş', 'щ': 'ş', 'ў': 'ö', 'ғ': 'ğ', 'ъ': 'ʼ' }),
            ye: 'ye', sh: 's', ng: null
        },
        // Uzbek Yañalif after the 1934 reform: о -> a, ў -> o, ч -> c, ж -> ç, й -> j,
        // ғ -> ƣ, нг -> ꞑ, lower-case b is ʙ.
        yanalif: {
            map: extend(CYR_BASE, {
                'б': 'ʙ', 'ё': 'ja', 'ж': 'ç', 'й': 'j', 'о': 'a', 'ч': 'c', 'ш': 'ş', 'щ': 'ş',
                'ъ': 'ʼ', 'ю': 'ju', 'я': 'ja', 'ў': 'o', 'ғ': 'ƣ'
            }),
            ye: 'je', sh: 's', ng: 'ꞑ'
        }
    };

    // Yangi imlo (reformed Arabic script of the 1920s): every vowel is written.
    var CYR_ARABIC = {
        'а': 'ە', 'б': 'ب', 'в': 'ۋ', 'г': 'گ', 'д': 'د', 'ё': 'يا', 'ж': 'ج', 'з': 'ز',
        'и': 'ى', 'й': 'ي', 'к': 'ک', 'л': 'ل', 'м': 'م', 'н': 'ن', 'о': 'ا', 'п': 'پ',
        'р': 'ر', 'с': 'س', 'т': 'ت', 'у': 'ۇ', 'ф': 'ف', 'х': 'خ', 'ч': 'چ', 'ш': 'ش',
        'щ': 'ش', 'ъ': 'ء', 'ь': '', 'ы': 'ى', 'э': 'ې', 'ю': 'يۇ', 'я': 'يە', 'ў': 'ۉ',
        'қ': 'ق', 'ғ': 'غ', 'ҳ': 'ھ'
    };
    var ARABIC_PUNCTUATION = { ',': '،', '?': '؟', ';': '؛' };

    var SCRIPTS = ['latin', 'latin2026', 'cyrillic', 'arabic', 'yanalif'];
    var SOURCE_SCRIPTS = ['latin', 'latin2026', 'cyrillic'];

    function isApostropheChar(c) {
        return c !== undefined && c !== '' && APOSTROPHES.indexOf(c) !== -1;
    }

    // ʻ and ʼ are Unicode letters (Lm), so exclude apostrophes explicitly.
    function isLetter(c) {
        return c !== undefined && !isApostropheChar(c) && LETTER.test(c);
    }

    function isUpper(c) {
        return c !== undefined && c !== c.toLowerCase() && c === c.toUpperCase();
    }

    function lower(c) {
        var l = c.toLowerCase();
        return l.length === c.length ? l : c;
    }

    function upperIf(s, up) {
        return up ? s.toUpperCase() : s;
    }

    // ʙ (Yañalif lower-case b) has no Unicode upper case of its own.
    function latUpper(s) {
        return s.toUpperCase().replace(/ʙ/g, 'B');
    }

    // An apostrophe between two letters (not a quotation mark).
    function aposAt(ch, j) {
        return isApostropheChar(ch[j]) && isLetter(ch[j - 1]) && isLetter(ch[j + 1]);
    }

    // A capital letter written with two letters becomes "Sh" in a capitalised
    // word and "SH" in an all-caps word.
    function caseFor(ch, i, s) {
        var next = ch[i + 1];
        var prev = ch[i - 1];
        var allCaps = isLetter(next) ? isUpper(next) : (isLetter(prev) && isUpper(prev));
        return allCaps ? latUpper(s) : latUpper(s.charAt(0)) + s.slice(1);
    }

    function latinToCyrillic(text) {
        if (!text) {
            return '';
        }
        var ch = Array.from(String(text));
        var lc = ch.map(lower);
        var out = '';

        function apos(j) {
            return isApostropheChar(ch[j]) && isLetter(ch[j - 1]) && isLetter(ch[j + 1]);
        }

        function inWord(j) {
            return isLetter(ch[j]) || apos(j);
        }

        // t + s is "ц" in loanwords (tsirk, stantsiya, abzats) but "тс" where
        // an Uzbek suffix starts with s: ket-sa, ayt-sin, sifat-siz, daraxt-simon.
        function tsIsOneLetter(i) {
            if (!inWord(i - 1)) {
                return true;
            }
            var rest = '';
            for (var j = i + 2; j < lc.length && isLetter(ch[j]); j++) {
                rest += lc[j];
            }
            if (rest === '') {
                return true;
            }
            return !/^(a|iz|imon|in($|lar|mi|chi))/.test(rest);
        }

        for (var i = 0; i < ch.length; i++) {
            var c = ch[i];
            var l = lc[i];
            var n = lc[i + 1];
            var up = isUpper(c);

            if ((l === 'o' || l === 'g') && apos(i + 1)) {
                out += upperIf(l === 'o' ? 'ў' : 'ғ', up);
                i++;
                continue;
            }
            // s'h marks a separate s and h (Is'hoq -> Исҳоқ).
            if (l === 's' && apos(i + 1) && lc[i + 2] === 'h') {
                out += upperIf('с', up) + upperIf('ҳ', isUpper(ch[i + 2]));
                i += 2;
                continue;
            }
            if (apos(i)) {
                out += upperIf('ъ', isUpper(ch[i - 1]) && isUpper(ch[i + 1]));
                continue;
            }

            var pair = n !== undefined ? LAT_PAIR[l + n] : undefined;
            if (pair) {
                var split = (l === 'y' && n === 'o' && apos(i + 2)) || // yo'l -> йўл
                    (l === 't' && n === 's' && !tsIsOneLetter(i));
                if (!split) {
                    out += upperIf(pair, up);
                    i++;
                    continue;
                }
            }

            if (l === 'e' && (!inWord(i - 1) || LAT_VOWELS.indexOf(lc[i - 1]) !== -1)) {
                out += upperIf('э', up);
                continue;
            }

            var single = LAT_SINGLE[l];
            out += single ? upperIf(single, up) : c;
        }
        return out;
    }

    // Cyrillic -> one of the Latin-based scripts (see PROFILES).
    function fromCyrillic(text, profile) {
        if (!text) {
            return '';
        }
        var ch = Array.from(String(text));
        var lc = ch.map(lower);
        var out = '';

        for (var i = 0; i < ch.length; i++) {
            var c = ch[i];
            var l = lc[i];
            var prev = lc[i - 1];
            var afterVowel = prev !== undefined && CYR_VOWELS.indexOf(prev) !== -1;
            var lat;

            if (l === 'е') {
                // ye at the start of a word and after a vowel or ъ/ь (ер -> yer, поезд -> poyezd)
                lat = (!isLetter(ch[i - 1]) || afterVowel || prev === 'ъ' || prev === 'ь') ? profile.ye : 'e';
            } else if (l === 'ц') {
                // official rule: ts after a vowel, s elsewhere (цирк -> sirk, лицей -> litsey)
                lat = afterVowel ? 'ts' : 's';
            } else if (l === 'с' && lc[i + 1] === 'ҳ') {
                lat = profile.sh; // Исҳоқ -> Is'hoq
            } else if (l === 'н' && lc[i + 1] === 'г' && profile.ng) {
                out += upperIf(profile.ng, isUpper(c)); // тенг -> teꞑ
                i++;
                continue;
            } else {
                lat = profile.map[l];
            }

            if (lat === undefined) {
                out += c;
                continue;
            }
            out += isUpper(c) && lat ? caseFor(ch, i, lat) : lat;
        }
        return out;
    }

    function cyrillicToLatin(text) {
        return fromCyrillic(text, PROFILES.latin);
    }

    function cyrillicToLatin2026(text) {
        return fromCyrillic(text, PROFILES.latin2026);
    }

    function cyrillicToYanalif(text) {
        return fromCyrillic(text, PROFILES.yanalif);
    }

    // 1995 Latin -> 2026 Latin: oʻ gʻ sh ch -> ö ğ ş ç, sʼh -> sh, tutuq -> ʼ.
    function latinToLatin2026(text) {
        if (!text) {
            return '';
        }
        var ch = Array.from(String(text));
        var lc = ch.map(lower);
        var out = '';

        for (var i = 0; i < ch.length; i++) {
            var c = ch[i];
            var l = lc[i];
            var up = isUpper(c);

            if ((l === 'o' || l === 'g') && aposAt(ch, i + 1)) {
                out += upperIf(l === 'o' ? 'ö' : 'ğ', up);
                i++;
            } else if (l === 's' && aposAt(ch, i + 1) && lc[i + 2] === 'h') {
                out += c + ch[i + 2]; // Is'hoq -> Ishoq: no ambiguity once sh is ş
                i += 2;
            } else if ((l === 's' || l === 'c') && lc[i + 1] === 'h') {
                out += upperIf(l === 's' ? 'ş' : 'ç', up);
                i++;
            } else if (aposAt(ch, i)) {
                out += 'ʼ';
            } else {
                out += c;
            }
        }
        return out;
    }

    // 2026 Latin -> 1995 Latin: ö ğ ş ç -> o' g' sh ch, sh -> s'h, ʼ -> '.
    function latin2026ToLatin(text) {
        if (!text) {
            return '';
        }
        var ch = Array.from(String(text));
        var lc = ch.map(lower);
        var out = '';

        for (var i = 0; i < ch.length; i++) {
            var c = ch[i];
            var l = lc[i];
            var up = isUpper(c);

            if (l === 'ş' || l === 'ç') {
                var pair = l === 'ş' ? 'sh' : 'ch';
                out += up ? caseFor(ch, i, pair) : pair;
            } else if (l === 'ö' || l === 'ğ') {
                out += upperIf(l === 'ö' ? 'o' : 'g', up) + '\'';
            } else if (l === 's' && lc[i + 1] === 'h') {
                out += c + '\''; // Ishoq -> Is'hoq
            } else if (aposAt(ch, i)) {
                out += '\'';
            } else {
                out += c;
            }
        }
        return out;
    }

    // Cyrillic -> Arabic script (Yangi imlo). Experimental: a vowel at the
    // start of a word or after another vowel gets a hamza seat ئ.
    function cyrillicToArabic(text) {
        if (!text) {
            return '';
        }
        var ch = Array.from(String(text));
        var lc = ch.map(lower);
        var out = '';

        for (var i = 0; i < ch.length; i++) {
            var c = ch[i];
            var l = lc[i];
            var prev = lc[i - 1];
            var wordStart = !isLetter(ch[i - 1]);
            var afterVowel = prev !== undefined && CYR_VOWELS.indexOf(prev) !== -1;
            var vowel = 'аоуўиэы'.indexOf(l) !== -1;
            var ar;

            if (l === 'н' && lc[i + 1] === 'г') {
                out += 'ڭ';
                i++;
                continue;
            }
            if (l === 'е') {
                var ye = wordStart || afterVowel || prev === 'ъ' || prev === 'ь';
                ar = ye ? 'يې' : 'ې';
                vowel = !ye;
            } else if (l === 'ц') {
                ar = afterVowel ? 'تس' : 'س';
            } else {
                ar = CYR_ARABIC[l];
            }

            if (ar === undefined) {
                out += ARABIC_PUNCTUATION[c] || c;
                continue;
            }
            if (vowel && (wordStart || afterVowel)) {
                ar = 'ئ' + ar;
            }
            out += ar;
        }
        return out;
    }

    // Convert between any two scripts. Sources: latin, latin2026, cyrillic.
    // Targets: latin, latin2026, cyrillic, arabic, yanalif.
    function convert(text, from, to) {
        if (SOURCE_SCRIPTS.indexOf(from) === -1) {
            throw new Error('Unsupported source script: ' + from);
        }
        if (SCRIPTS.indexOf(to) === -1) {
            throw new Error('Unsupported target script: ' + to);
        }
        if (!text) {
            return '';
        }
        text = String(text).normalize('NFC');
        if (from === to) {
            return text;
        }
        if (from === 'latin' && to === 'latin2026') {
            return latinToLatin2026(text);
        }
        if (from === 'latin2026' && to === 'latin') {
            return latin2026ToLatin(text);
        }

        var cyr = from === 'cyrillic' ? text
            : latinToCyrillic(from === 'latin2026' ? latin2026ToLatin(text) : text);
        switch (to) {
            case 'cyrillic': return cyr;
            case 'latin': return cyrillicToLatin(cyr);
            case 'latin2026': return cyrillicToLatin2026(cyr);
            case 'yanalif': return cyrillicToYanalif(cyr);
            default: return cyrillicToArabic(cyr);
        }
    }

    return {
        SCRIPTS: SCRIPTS.slice(),
        SOURCE_SCRIPTS: SOURCE_SCRIPTS.slice(),
        convert: convert,
        latinToCyrillic: latinToCyrillic,
        cyrillicToLatin: cyrillicToLatin,
        latinToLatin2026: latinToLatin2026,
        latin2026ToLatin: latin2026ToLatin,
        cyrillicToLatin2026: cyrillicToLatin2026,
        cyrillicToYanalif: cyrillicToYanalif,
        cyrillicToArabic: cyrillicToArabic
    };
}));
