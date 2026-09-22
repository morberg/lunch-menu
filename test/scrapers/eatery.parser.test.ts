import * as fs from 'fs';
import * as path from 'path';
import { findEateryOrdinaryPrice } from '../../src/scrapers/eatery';

describe('Eatery menu parser', () => {
    test('extracts the ordinary price instead of the early-bird price', () => {
        const fixturePath = path.join(__dirname, '..', 'fixtures', 'eatery-main.html');
        const html = fs.readFileSync(fixturePath, 'utf8');

        expect(findEateryOrdinaryPrice(html)).toBe(139);
    });
});