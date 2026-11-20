'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { latinToCyrillic, cyrillicToLatin } = require('../assets/scripts/translit.js');

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
