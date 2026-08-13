import { bodyText, htmlToText } from '../../src/utils/html-text';

describe('HTML text utilities', () => {
    test('strips non-visible blocks and decodes common entities', () => {
        const html = '<main>Hello&nbsp;<strong>world</strong><script>ignored()</script><style>.hidden{}</style>&amp; friends</main>';

        expect(htmlToText(html)).toBe('Hello world & friends');
    });

    test('reads only body content when a document body is present', () => {
        const html = '<html><head><title>Ignored</title></head><body>Visible <em>menu</em></body></html>';

        expect(bodyText(html)).toBe('Visible menu');
    });
});