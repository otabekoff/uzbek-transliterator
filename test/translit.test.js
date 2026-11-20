'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { latinToCyrillic, cyrillicToLatin } = require('../src/scripts/translit.js');

function table(fn, cases) {
    for (const [input, expected] of cases) {
        assert.equal(fn(input), expected, JSON.stringify(input));
    }
}

test('latin -> cyrillic: basic words', () => {
    table(latinToCyrillic, [
        ['shahar', 'шаҳар'],
        ['Toshkent', 'Тошкент'],
        ['choy', 'чой'],
        ['qishloq', 'қишлоқ'],
        ['xalq', 'халқ'],
        ['yoz', 'ёз'],
        ['yulduz', 'юлдуз'],
        ['yaxshi', 'яхши'],
        ['yer', 'ер'],
        ['poyezd', 'поезд'],
        ['', ''],
    ]);
});

test('latin -> cyrillic: every apostrophe form', () => {
    for (const a of ['\'', '’', '‘', 'ʻ', 'ʼ', '`']) {
        assert.equal(latinToCyrillic(`o${a}zbek`), 'ўзбек', a);
        assert.equal(latinToCyrillic(`g${a}oz`), 'ғоз', a);
        assert.equal(latinToCyrillic(`ma${a}no`), 'маъно', a);
        assert.equal(latinToCyrillic(`O${a}zbekiston`), 'Ўзбекистон', a);
    }
});

test('latin -> cyrillic: quotation marks are not apostrophes', () => {
    table(latinToCyrillic, [
        ['‘salom’', '‘салом’'],
        ['\'salom\'', '\'салом\''],
        ['bo’ ', 'бо’ '],
    ]);
});

test('latin -> cyrillic: y before o\' and ya\'', () => {
    table(latinToCyrillic, [
        ['yo\'l', 'йўл'],
        ['Yo\'lchi', 'Йўлчи'],
        ['YO\'L', 'ЙЎЛ'],
        ['ya\'ni', 'яъни'],
    ]);
});

test('latin -> cyrillic: s\'h is a separate s and h', () => {
    table(latinToCyrillic, [
        ['Is\'hoq', 'Исҳоқ'],
        ['as\'hob', 'асҳоб'],
    ]);
});

test('latin -> cyrillic: e / э', () => {
    table(latinToCyrillic, [
        ['erkin', 'эркин'],
        ['Ergash', 'Эргаш'],
        ['"ekan"', '"экан"'],
        ['«eshik»', '«эшик»'],
        ['\tel', '\tэл'],
        ['so\'z: ertaga', 'сўз: эртага'],
        ['aeroport', 'аэропорт'],
        ['poeziya', 'поэзия'],
        ['kel', 'кел'],
    ]);
});

test('latin -> cyrillic: upper case', () => {
    table(latinToCyrillic, [
        ['O\'ZBEKISTON', 'ЎЗБЕКИСТОН'],
        ['SHAHAR', 'ШАҲАР'],
        ['Shahar', 'Шаҳар'],
        ['MA\'NO', 'МАЪНО'],
        ['E', 'Э'],
        ['KELDI', 'КЕЛДИ'],
    ]);
});

test('latin -> cyrillic: ts is тс at suffix boundaries, ц in loanwords', () => {
    table(latinToCyrillic, [
        ['ketsa', 'кетса'],
        ['aytsa', 'айтса'],
        ['o\'tsangiz', 'ўтсангиз'],
        ['ketsin', 'кетсин'],
        ['aytsinlar', 'айтсинлар'],
        ['sifatsiz', 'сифатсиз'],
        ['daraxtsimon', 'дарахтсимон'],
        ['tsirk', 'цирк'],
        ['stantsiya', 'станция'],
        ['meditsina', 'медицина'],
        ['abzats', 'абзац'],
        ['kontsert', 'концерт'],
    ]);
});

test('latin -> cyrillic: other characters pass through unchanged', () => {
    table(latinToCyrillic, [
        ['1 < 2 & 3', '1 < 2 & 3'],
        ['<b>salom</b> &amp;', '<б>салом</б> &амп;'],
        ['line1\nline2', 'лине1\nлине2'],
        ['салом', 'салом'],
        ['😀 ok', '😀 ок'],
    ]);
});

test('cyrillic -> latin: basic words', () => {
    table(cyrillicToLatin, [
        ['шаҳар', 'shahar'],
        ['Тошкент', 'Toshkent'],
        ['Ўзбекистон', 'O\'zbekiston'],
        ['ғоз', 'g\'oz'],
        ['маъно', 'ma\'no'],
        ['Исҳоқ', 'Is\'hoq'],
        ['ёз', 'yoz'],
        ['юлдуз', 'yulduz'],
        ['яхши', 'yaxshi'],
        ['', ''],
    ]);
});

test('cyrillic -> latin: е and ц depend on position', () => {
    table(cyrillicToLatin, [
        ['ер', 'yer'],
        ['поезд', 'poyezd'],
        ['кел', 'kel'],
        ['эркин', 'erkin'],
        ['цирк', 'sirk'],
        ['концерт', 'konsert'],
        ['лицей', 'litsey'],
    ]);
});

test('cyrillic -> latin: upper case', () => {
    table(cyrillicToLatin, [
        ['ШАҲАР', 'SHAHAR'],
        ['Шаҳар', 'Shahar'],
        ['ЎЗБЕКИСТОН', 'O\'ZBEKISTON'],
        ['Ш', 'Sh'],
        ['ЁЗ', 'YOZ'],
        ['Ер', 'Yer'],
    ]);
});

test('round trip latin -> cyrillic -> latin', () => {
    const text = 'O\'zbekiston Respublikasi poytaxti Toshkent shahri. Yo\'lda ketsa, ma\'no bor.';
    assert.equal(cyrillicToLatin(latinToCyrillic(text)), text);
});

const T = require('../src/scripts/translit.js');

test('latin 1995 -> latin 2026 (law of 21 Oct 2026)', () => {
    table(T.latinToLatin2026, [
        ["O'zbekiston", 'Özbekiston'],
        ['gʻoz', 'ğoz'],
        ['shahar', 'şahar'],
        ['SHAHAR', 'ŞAHAR'],
        ['Choy', 'Çoy'],
        ["ma'no", 'maʼno'],
        ["Is'hoq", 'Ishoq'],
        ["sho'rva", 'şörva'],
        ['‘salom’', '‘salom’'],
    ]);
});

test('latin 2026 -> latin 1995', () => {
    table(T.latin2026ToLatin, [
        ['Özbekiston', "O'zbekiston"],
        ['ğoz', "g'oz"],
        ['Şahar', 'Shahar'],
        ['ŞAHAR', 'SHAHAR'],
        ['çoy', 'choy'],
        ['maʼno', "ma'no"],
        ['Ishoq', "Is'hoq"],
    ]);
});

test('convert: every source to every target', () => {
    const cyr = 'Ўзбекистон шаҳри, Исҳоқ, маъно, чой, тонг';
    const lat = "O'zbekiston shahri, Is'hoq, ma'no, choy, tong";
    const lat26 = 'Özbekiston şahri, Ishoq, maʼno, çoy, tong';
    for (const [from, text] of [['cyrillic', cyr], ['latin', lat], ['latin2026', lat26]]) {
        assert.equal(T.convert(text, from, 'cyrillic'), cyr, from + ' -> cyrillic');
        assert.equal(T.convert(text, from, 'latin'), lat, from + ' -> latin');
        assert.equal(T.convert(text, from, 'latin2026'), lat26, from + ' -> latin2026');
        assert.equal(T.convert(text, from, 'yanalif'), 'Ozʙekistan şahri, Ishaq, maʼna, caj, taꞑ', from + ' -> yanalif');
        assert.equal(T.convert(text, from, 'arabic'), 'ئۉزبېکىستان شەھرى، ئىسھاق، مەءنا، چاي، تاڭ', from + ' -> arabic');
    }
});

test('convert: decomposed ö (o + U+0308) is normalised', () => {
    assert.equal(T.convert('O\u0308zbekiston', 'latin2026', 'cyrillic'), 'Ўзбекистон');
});

test('convert: arabic and yanalif are targets only', () => {
    assert.throws(() => T.convert('x', 'arabic', 'latin'));
    assert.throws(() => T.convert('x', 'yanalif', 'latin'));
    assert.throws(() => T.convert('x', 'latin', 'klingon'));
});

test('yanalif: 1934 orthography', () => {
    table(T.cyrillicToYanalif, [
        ['Барча одамлар тенг', 'Barca adamlar teꞑ'],
        ['туғиладилар', 'tuƣiladilar'],
        ['ёз, юлдуз, яхши, ер', 'jaz, julduz, jaxşi, jer'],
        ['жон, чой', 'çan, caj'],
        ['БЎЛИБ', 'BOLIB'],
    ]);
});

test('arabic: vowels at word start take ئ, punctuation is Arabic', () => {
    table(T.cyrillicToArabic, [
        ['олма', 'ئالمە'],
        ['китоб', 'کىتاب'],
        ['эркин', 'ئېرکىن'],
        ['ер', 'يېر'],
        ['ҳа, йўқ?', 'ھە، يۉق؟'],
    ]);
});
