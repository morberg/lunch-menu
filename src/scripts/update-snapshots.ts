import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

const snapshotDir = path.resolve(__dirname, '..', '..', 'test', 'fixtures');
const userAgent = 'Mozilla/5.0 (lunch-menu-snapshot)';

const ensureDir = () => {
    fs.mkdirSync(snapshotDir, { recursive: true });
};

const pruneSnapshots = (allowedFiles: string[]) => {
    const entries = fs.readdirSync(snapshotDir, { withFileTypes: true });
    for (const entry of entries) {
        const entryPath = path.join(snapshotDir, entry.name);
        if (entry.isDirectory()) {
            if (!allowedFiles.includes(entry.name)) {
                fs.rmSync(entryPath, { recursive: true, force: true });
            }
            continue;
        }

        if (!allowedFiles.includes(entry.name)) {
            fs.rmSync(entryPath, { force: true });
        }
    }
};

const writeTextSnapshot = (fileName: string, html: string) => {
    const targetPath = path.join(snapshotDir, fileName);
    fs.writeFileSync(targetPath, html, 'utf8');
    console.log(`✓ Saved ${fileName}`);
};

const writeBinarySnapshot = (fileName: string, data: Buffer) => {
    const targetPath = path.join(snapshotDir, fileName);
    fs.writeFileSync(targetPath, data);
    console.log(`✓ Saved ${fileName}`);
};

const fetchHtml = async (url: string): Promise<string> => {
    const response = await axios.get(url, {
        headers: { 'User-Agent': userAgent },
        timeout: 20000
    });
    return response.data;
};

const updateEaterySnapshots = async () => {
    const mainUrl = 'https://eatery.se/anlaggningar/lund';
    const mainHtml = await fetchHtml(mainUrl);
    writeTextSnapshot('eatery-main.html', mainHtml);

    const $ = cheerio.load(mainHtml);
    let lunchMenuUrl = '';

    $('a').each((_, element) => {
        const linkText = $(element).text().trim();
        const href = $(element).attr('href');

        if (linkText.toLowerCase().includes('lunchmeny') && href && href.includes('.pdf')) {
            try {
                lunchMenuUrl = new URL(href, mainUrl).toString();
            } catch {
                lunchMenuUrl = href;
            }
            return false;
        }
        return undefined;
    });

    if (!lunchMenuUrl) {
        throw new Error('Eatery snapshot failed: could not find lunch menu PDF URL');
    }

    const pdfResponse = await axios.get(lunchMenuUrl, {
        responseType: 'arraybuffer',
        timeout: 20000,
        headers: { 'User-Agent': userAgent }
    });

    writeBinarySnapshot('eatery-menu.pdf', Buffer.from(pdfResponse.data));
};

const updateSnapshots = async () => {
    ensureDir();

    const htmlSnapshots: Array<{ file: string; url: string }> = [
        { file: 'edison.html', url: 'https://restaurangedison.se/lunch/' },
        { file: 'bricks.html', url: 'https://brickseatery.se/lunch/' },
        { file: 'kantin.html', url: 'https://www.kantinlund.se/' },
        { file: 'smakapakina.html', url: 'https://www.smakapakina.se/meny/' },
        { file: 'foodhall.html', url: 'https://www.nordrest.se/restaurang/food-hall/' },
        { file: 'grenden.html', url: 'https://www.nordrest.se/restaurang/grenden/' }
    ];

    const allowedFiles = [
        ...htmlSnapshots.map((snapshot) => snapshot.file),
        'eatery-main.html',
        'eatery-menu.pdf'
    ];

    pruneSnapshots(allowedFiles);

    for (const snapshot of htmlSnapshots) {
        const html = await fetchHtml(snapshot.url);
        writeTextSnapshot(snapshot.file, html);
    }

    await updateEaterySnapshots();
};

updateSnapshots().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
