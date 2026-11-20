/*
 * Uzbek Latin <-> Cyrillic transliteration.
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

    var CYR = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ё': 'yo',
        'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l',
        'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's',
        'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x', 'ч': 'ch', 'ш': 'sh',
        'щ': 'sh', 'ъ': '\'', 'ь': '', 'ы': 'i', 'э': 'e', 'ю': 'yu',
        'я': 'ya', 'ў': 'o\'', 'қ': 'q', 'ғ': 'g\'', 'ҳ': 'h'
    };
    var CYR_VOWELS = 'аеёиоуэюяўы';

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

    function cyrillicToLatin(text) {
        if (!text) {
            return '';
        }
        var ch = Array.from(String(text));
        var lc = ch.map(lower);
        var out = '';

        // A capital Cyrillic letter that becomes two Latin letters is written
        // "Sh" in a capitalised word and "SH" in an all-caps word.
        function caseFor(lat, i) {
            var next = ch[i + 1];
            var prev = ch[i - 1];
            var allCaps = isLetter(next) ? isUpper(next) : (isLetter(prev) && isUpper(prev));
            return allCaps ? lat.toUpperCase() : lat.charAt(0).toUpperCase() + lat.slice(1);
        }

        for (var i = 0; i < ch.length; i++) {
            var c = ch[i];
            var l = lc[i];
            var prev = lc[i - 1];
            var afterVowel = prev !== undefined && CYR_VOWELS.indexOf(prev) !== -1;
            var lat;

            if (l === 'е') {
                // ye at the start of a word and after a vowel or ъ/ь (ер -> yer, поезд -> poyezd)
                lat = (!isLetter(ch[i - 1]) || afterVowel || prev === 'ъ' || prev === 'ь') ? 'ye' : 'e';
            } else if (l === 'ц') {
                // official rule: ts after a vowel, s elsewhere (цирк -> sirk, лицей -> litsey)
                lat = afterVowel ? 'ts' : 's';
            } else if (l === 'с' && lc[i + 1] === 'ҳ') {
                lat = 's\''; // Исҳоқ -> Is'hoq
            } else {
                lat = CYR[l];
            }

            if (lat === undefined) {
                out += c;
                continue;
            }
            out += isUpper(c) ? caseFor(lat, i) : lat;
        }
        return out;
    }

    return {
        latinToCyrillic: latinToCyrillic,
        cyrillicToLatin: cyrillicToLatin
    };
}));
