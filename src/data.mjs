// Content shared by every page: the alphabet comparison table and the sample text.

// Columns of the alphabet table, in order.
export const ALPHABET_COLUMNS = ['cyrillic', 'latin', 'latin2026', 'yanalif', 'arabic'];

// [Cyrillic, Latin 1995, Latin 2026, Yanalif 1934, Arabic (Yangi imlo)], in Uzbek Cyrillic order.
export const ALPHABET = [
    ['А а', 'A a', 'A a', 'A a', 'ە'],
    ['Б б', 'B b', 'B b', 'B ʙ', 'ب'],
    ['В в', 'V v', 'V v', 'V v', 'ۋ'],
    ['Г г', 'G g', 'G g', 'G g', 'گ'],
    ['Д д', 'D d', 'D d', 'D d', 'د'],
    ['Е е', 'E e · Ye ye', 'E e · Ye ye', 'E e · Je je', 'ې · يې'],
    ['Ё ё', 'Yo yo', 'Yo yo', 'Ja ja', 'يا'],
    ['Ж ж', 'J j', 'J j', 'Ç ç', 'ج'],
    ['З з', 'Z z', 'Z z', 'Z z', 'ز'],
    ['И и', 'I i', 'I i', 'I i', 'ى'],
    ['Й й', 'Y y', 'Y y', 'J j', 'ي'],
    ['К к', 'K k', 'K k', 'K k', 'ک'],
    ['Л л', 'L l', 'L l', 'L l', 'ل'],
    ['М м', 'M m', 'M m', 'M m', 'م'],
    ['Н н', 'N n', 'N n', 'N n', 'ن'],
    ['Нг нг', 'Ng ng', 'Ng ng', 'Ꞑ ꞑ', 'ڭ'],
    ['О о', 'O o', 'O o', 'A a', 'ا'],
    ['П п', 'P p', 'P p', 'P p', 'پ'],
    ['Р р', 'R r', 'R r', 'R r', 'ر'],
    ['С с', 'S s', 'S s', 'S s', 'س'],
    ['Т т', 'T t', 'T t', 'T t', 'ت'],
    ['У у', 'U u', 'U u', 'U u', 'ۇ'],
    ['Ф ф', 'F f', 'F f', 'F f', 'ف'],
    ['Х х', 'X x', 'X x', 'X x', 'خ'],
    ['Ц ц', 'Ts ts · S s', 'Ts ts · S s', 'Ts ts · S s', 'تس · س'],
    ['Ч ч', 'Ch ch', 'Ç ç', 'C c', 'چ'],
    ['Ш ш', 'Sh sh', 'Ş ş', 'Ş ş', 'ش'],
    ['Ъ ъ', 'ʼ', 'ʼ', 'ʼ', 'ء'],
    ['Ь ь', '–', '–', '–', '–'],
    ['Э э', 'E e', 'E e', 'E e', 'ې'],
    ['Ю ю', 'Yu yu', 'Yu yu', 'Ju ju', 'يۇ'],
    ['Я я', 'Ya ya', 'Ya ya', 'Ja ja', 'يە'],
    ['Ў ў', 'Oʻ oʻ', 'Ö ö', 'O o', 'ۉ'],
    ['Қ қ', 'Q q', 'Q q', 'Q q', 'ق'],
    ['Ғ ғ', 'Gʻ gʻ', 'Ğ ğ', 'Ƣ ƣ', 'غ'],
    ['Ҳ ҳ', 'H h', 'H h', 'H h', 'ھ']
];

// Sample text for the "Sample" button, in 1995 Latin; the page converts it to the source script.
export const SAMPLE_LATIN = 'Oʻzbekiston Respublikasi Markaziy Osiyodagi davlat. Poytaxti Toshkent shahri.\n' +
    'Ertaga yoʻlga chiqsak, kechqurun yetib boramiz. Maʼno-mazmuni aniq boʻlsin!';
