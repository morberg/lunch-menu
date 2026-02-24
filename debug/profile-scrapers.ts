/**
 * Profiler: measures parse time for each scraper using local fixture files.
 * Run with: make debug-profile-scrapers
 */
import * as path from 'path';
import * as fs from 'fs';
import { parseBricksHtml } from '../src/scrapers/bricks';
import { parseEdisonMenuFromHtml } from '../src/scrapers/edison';
import { parseKantinMenuFromHtml } from '../src/scrapers/kantin';
import { parseFoodHallMenuFromHtml } from '../src/scrapers/foodhall';
import { parseGrendenMenuFromHtml } from '../src/scrapers/grenden';
import { parseSmakapakinaMenuFromHtml } from '../src/scrapers/smakapakina';

const FIXTURES = path.join(__dirname, '..', 'test', 'fixtures');
const RUNS = 200;

function readFixture(name: string): string {
    return fs.readFileSync(path.join(FIXTURES, name), 'utf8');
}

async function bench(name: string, fn: () => unknown, runs = RUNS): Promise<number> {
    // Warm-up
    for (let i = 0; i < 5; i++) fn();

    const start = performance.now();
    for (let i = 0; i < runs; i++) fn();
    const elapsed = performance.now() - start;
    const perCall = elapsed / runs;

    const bar = '█'.repeat(Math.max(1, Math.ceil(perCall)));
    console.log(`${name.padEnd(22)} ${perCall.toFixed(3).padStart(8)} ms/call  ${bar}`);
    return perCall;
}

async function main() {
    console.log(`\n=== Scraper parse benchmark (${RUNS} runs each) ===\n`);

    const bricksHtml   = readFixture('bricks.html');
    const edisonHtml   = readFixture('edison.html');
    const kantinHtml   = readFixture('kantin.html');
    const foodhallHtml = readFixture('foodhall.html');
    const grendenHtml  = readFixture('grenden.html');
    const smakaHtml    = readFixture('smakapakina.html');

    const results: Record<string, number> = {};

    results['bricks']      = await bench('bricks',      () => parseBricksHtml(bricksHtml));
    results['edison']      = await bench('edison',      () => parseEdisonMenuFromHtml(edisonHtml));
    results['kantin']      = await bench('kantin',      () => parseKantinMenuFromHtml(kantinHtml));
    results['foodhall']    = await bench('foodhall',    () => parseFoodHallMenuFromHtml(foodhallHtml));
    results['grenden']     = await bench('grenden',     () => parseGrendenMenuFromHtml(grendenHtml));
    results['smakapakina'] = await bench('smakapakina', () => parseSmakapakinaMenuFromHtml(smakaHtml));

    console.log('\n--- cheerio.load() cost (inside totals above) ---\n');
    const cheerio = await import('cheerio');
    await bench('load(bricks)',   () => cheerio.load(bricksHtml));
    await bench('load(edison)',   () => cheerio.load(edisonHtml));
    await bench('load(kantin)',   () => cheerio.load(kantinHtml));
    await bench('load(foodhall)', () => cheerio.load(foodhallHtml));
    await bench('load(grenden)',  () => cheerio.load(grendenHtml));
    await bench('load(smakap.)',  () => cheerio.load(smakaHtml));

    const slowest = Object.entries(results).sort((a, b) => b[1] - a[1]);
    console.log('\n--- Slowest scrapers ---');
    slowest.forEach(([name, ms]) => console.log(`  ${name.padEnd(20)} ${ms.toFixed(3)} ms`));

    const mem = process.memoryUsage();
    console.log('\n--- Memory ---');
    console.log(`  RSS:  ${(mem.rss / 1024 / 1024).toFixed(1)} MB`);
    console.log(`  Heap: ${(mem.heapUsed / 1024 / 1024).toFixed(1)} / ${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`);
    console.log('');
}

main().catch(console.error);
