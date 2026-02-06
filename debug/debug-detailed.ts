import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

async function debugParsing() {
    try {
        console.log('Reading local Eatery PDF fixture...');

        const fixturePath = path.resolve(process.cwd(), 'test/fixtures/eatery-menu.pdf');
        const pdfBuffer = fs.readFileSync(fixturePath);
        const pdfData = await pdf(pdfBuffer);

        const pdfText = pdfData.text;
        const menuItems: Array<{ name: string; day: string; price: number }> = [];

        const dayNames = ['måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag'];
        const dayMap: Record<string, string> = {
            'måndag': 'Måndag',
            'tisdag': 'Tisdag',
            'onsdag': 'Onsdag',
            'torsdag': 'Torsdag',
            'fredag': 'Fredag'
        };

        const lines = pdfText
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        let currentDay = '';
        let currentDish = '';

        console.log('\n=== PARSING DEBUG ===');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            const dayFound = dayNames.find((day) => line.toLowerCase().includes(day));
            if (dayFound) {
                console.log(`\nDAY FOUND: ${dayFound} (line ${i}: "${line}")`);

                if (currentDish && currentDay && currentDish.length > 15) {
                    console.log(`  SAVING PENDING DISH: "${currentDish}"`);
                    const cleanDish = currentDish
                        .replace(/\s+/g, ' ')
                        .replace(/,\s*,/g, ',')
                        .replace(/^\s*,\s*/, '')
                        .replace(/\s*,\s*$/, '')
                        .trim();

                    if (!cleanDish.match(/^(Generös salladsbuffé|ar Ta mer|Byta rätt|Ta mer om|Något sött|kaffet)/i)) {
                        menuItems.push({
                            name: cleanDish,
                            day: dayMap[currentDay],
                            price: 135
                        });
                    }
                }

                currentDay = dayFound;
                currentDish = '';
                continue;
            }

            if (line.match(/^(Sweet Tuesday|Pancake Thursday|Vi bjuder|•|\d+%|Med reservation|Generös salladsbuffé|ar Ta mer|Byta rätt|Ta mer om|Något sött|kaffet)/i)) {
                console.log(`  SKIPPING JUNK: "${line}"`);
                continue;
            }

            if (line.length < 10 || line.match(/^[^A-ZÅÄÖ]/) || line.match(/^\d+$/)) {
                console.log(`  SKIPPING SHORT/INVALID: "${line}"`);
                continue;
            }

            const isNewDish = line.match(/^[A-ZÅÄÖ][a-zåäöüé\s]+/);
            const hasMainIngredient = line.match(/(kött|fisk|kyckling|lax|torsk|kolja|biff|anka|lamm|fläsk|räka|krabba|mussla|pasta|pizza|soppa|sallad|gryta|curry|paj|tart|burgare|wrap|quesadilla|risotto|revben|pluma|kungsfisk|frittata|polenta|högrev|sej|canneloni|kikärts)/i);
            const isContinuation = line.match(/^[a-zåäöüé]/) && line.trim().split(' ').length <= 3;

            console.log(`  LINE ${i}: "${line}"`);
            console.log(`    isNewDish: ${!!isNewDish}, hasMainIngredient: ${!!hasMainIngredient}, isContinuation: ${!!isContinuation}`);
            console.log(`    currentDish length: ${currentDish.length}, currentDay: ${currentDay}`);

            if (isNewDish && hasMainIngredient && currentDish && currentDay && !isContinuation) {
                console.log(`    STARTING NEW DISH - saving current: "${currentDish}"`);
                const cleanDish = currentDish
                    .replace(/\s+/g, ' ')
                    .replace(/,\s*,/g, ',')
                    .replace(/^\s*,\s*/, '')
                    .replace(/\s*,\s*$/, '')
                    .trim();

                if (cleanDish.length > 15 && !cleanDish.match(/^(Generös salladsbuffé|ar Ta mer|Byta rätt|Ta mer om|Något sött|kaffet)/i)) {
                    menuItems.push({
                        name: cleanDish,
                        day: dayMap[currentDay],
                        price: 135
                    });
                }

                currentDish = line;
                console.log(`    NEW DISH STARTED: "${currentDish}"`);
            } else if (currentDay) {
                console.log(`    CONTINUING DISH: adding "${line}" to "${currentDish}"`);
                if (currentDish) {
                    currentDish += ' ' + line;
                } else {
                    currentDish = line;
                }
                console.log(`    DISH NOW: "${currentDish}"`);
            }
        }

        if (currentDish && currentDay && currentDish.length > 15) {
            console.log(`\nSAVING FINAL DISH: "${currentDish}"`);
            const cleanDish = currentDish
                .replace(/\s+/g, ' ')
                .replace(/,\s*,/g, ',')
                .replace(/^\s*,\s*/, '')
                .replace(/\s*,\s*$/, '')
                .trim();

            if (!cleanDish.match(/^(Generös salladsbuffé|ar Ta mer|Byta rätt|Ta mer om|Något sött|kaffet)/i)) {
                menuItems.push({
                    name: cleanDish,
                    day: dayMap[currentDay],
                    price: 135
                });
            }
        }

        console.log('\n=== FINAL RESULTS ===');
        console.log(`Found ${menuItems.length} menu items:`);
        menuItems.forEach((item, i) => {
            console.log(`${i + 1}. [${item.day}] ${item.name} - ${item.price}`);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

debugParsing().catch((error) => {
    console.error('Error:', error);
});