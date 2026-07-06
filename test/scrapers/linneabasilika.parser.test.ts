import { parseLinneaBasilikaMenuFromHtml } from '../../src/scrapers/linneabasilika';

describe('Linnea & Basilika parser robustness', () => {
    test('parses per-day dishes and dynamically extracts the shared buffet price', () => {
        const html = `
            <div class="et_pb_text_inner"><h4>Måndag 6 juli</h4>
            <p>Kycklingfilé med zucchini i het thai grön curry</p>
            <p>Wokad grovmalen blandfärs med stark thai basilika</p></div>
            <div class="et_pb_text_inner"><h4>Tisdag 7 juli</h4>
            <p>Kycklingfilé med aubergine i kryddig thai röd curry</p></div>
            <div class="et_pb_text_inner"><h5><strong>Lunchbuffén serveras Måndag-Fredag helgfria vardagar mellan 11:30 - 14:30 för 179 kr.</strong></h5></div>
        `;

        const result = parseLinneaBasilikaMenuFromHtml(html);

        expect(result).toEqual([
            { name: 'Kycklingfilé med zucchini i het thai grön curry', price: 179, day: 'Måndag' },
            { name: 'Wokad grovmalen blandfärs med stark thai basilika', price: 179, day: 'Måndag' },
            { name: 'Kycklingfilé med aubergine i kryddig thai röd curry', price: 179, day: 'Tisdag' }
        ]);
    });

    test('ignores unrelated numbers (e.g. serving times or age-based prices) when locating the price', () => {
        const html = `
            <div class="et_pb_text_inner"><h4>Onsdag 8 juli</h4>
            <p>Wokad fläskfilé med champinjoner och bambuskott</p></div>
            <p>2-4 år 85:-<br />5-7 år 125:-<br />8-10 år 155:-<br />11-13 år 175:-</p>
            <p>Lunchbuffén serveras mellan 11:30 - 14:30 för 165 kr.</p>
        `;

        const result = parseLinneaBasilikaMenuFromHtml(html);

        expect(result).toEqual([
            { name: 'Wokad fläskfilé med champinjoner och bambuskott', price: 165, day: 'Onsdag' }
        ]);
    });

    test('returns null price when no matching price text is present', () => {
        const html = `
            <div class="et_pb_text_inner"><h4>Fredag 10 juli</h4>
            <p>Wokad kycklingfilé med stark thai basilika</p></div>
        `;

        const result = parseLinneaBasilikaMenuFromHtml(html);

        expect(result).toEqual([
            { name: 'Wokad kycklingfilé med stark thai basilika', price: null, day: 'Fredag' }
        ]);
    });
});
