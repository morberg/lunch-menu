const fs = require('fs'); const fs = require('fs'); "use strict";

const path = require('path');

const path = require('path'); var __importDefault = (this && this.__importDefault) || function (mod) {

    async function createExpectedResults() {

        const resultsDir = path.join(__dirname, 'test', 'fixtures', 'expected'); return (mod && mod.__esModule) ? mod : { "default": mod };



        if (!fs.existsSync(resultsDir)) {
            const scrapers = {};

            fs.mkdirSync(resultsDir, { recursive: true });

        } edison: require('./dist/scrapers/edison').scrapeEdisonMenu, Object.defineProperty(exports, "__esModule", { value: true });



        const scrapers = [bricks: require('./dist/scrapers/bricks').scrapeBricksMenu,const fs_1 = __importDefault(require("fs"));

        { name: 'edison', module: './dist/scrapers/edison', func: 'scrapeEdisonMenu' },

        { name: 'bricks', module: './dist/scrapers/bricks', func: 'scrapeBricksMenu' }, grenden: require('./dist/scrapers/grenden').scrapeGrendenMenu,const path_1 = __importDefault(require("path"));

        { name: 'kantin', module: './dist/scrapers/kantin', func: 'scrapeKantinMenu' },

        { name: 'eatery', module: './dist/scrapers/eatery', func: 'scrapeEatery' }, kantin: require('./dist/scrapers/kantin').scrapeKantinMenu,const edison_1 = require("./src/scrapers/edison");

        { name: 'smakapakina', module: './dist/scrapers/smakapakina', func: 'scrapeSmakapakina' },

    ]; eatery: require('./dist/scrapers/eatery').scrapeEatery,const bricks_1 = require("./src/scrapers/bricks");



for (const { name, module, func } of scrapers) {
    smakapakina: require('./dist/scrapers/smakapakina').scrapeSmakapakina,const grenden_1 = require("./src/scrapers/grenden");

    try {

        console.log(`Running ${name} scraper...`);
    }; const kantin_1 = require("./src/scrapers/kantin");

    const scraperModule = require(module);

    const scraper = scraperModule[func]; const eatery_1 = require("./src/scrapers/eatery");

    const menuItems = await scraper();

    async function createExpectedResults() {

        const expectedFilePath = path.join(resultsDir, `${name}.json`); const smakapakina_1 = require("./src/scrapers/smakapakina");

        fs.writeFileSync(expectedFilePath, JSON.stringify(menuItems, null, 2));

        const resultsDir = path.join(__dirname, 'test', 'fixtures', 'expected'); async function createExpectedResults() {

            console.log(`✓ Created expected results for ${name}: ${menuItems.length} items`);

        } catch (error) {
            const resultsDir = path_1.default.join(__dirname, 'test', 'fixtures', 'expected');

            console.error(`✗ Failed to create expected results for ${name}:`, error.message);

        } if (!fs.existsSync(resultsDir)) {    // Create directory if it doesn't exist

        }

    } fs.mkdirSync(resultsDir, { recursive: true }); if (!fs_1.default.existsSync(resultsDir)) {



        createExpectedResults();
    } fs_1.default.mkdirSync(resultsDir, { recursive: true });

}

for (const [name, scraper] of Object.entries(scrapers)) {
    const scrapers = [

        try {
        { name: 'edison', scraper: edison_1.scrapeEdisonMenu },

        console.log(`Running ${name} scraper...`); { name: 'bricks', scraper: bricks_1.scrapeBricksMenu },

        const menuItems = await scraper(); { name: 'grenden', scraper: grenden_1.scrapeGrendenMenu },

        { name: 'kantin', scraper: kantin_1.scrapeKantinMenu },

        const expectedFilePath = path.join(resultsDir, `${name}.json`); { name: 'eatery', scraper: eatery_1.scrapeEatery },

        fs.writeFileSync(expectedFilePath, JSON.stringify(menuItems, null, 2)); { name: 'smakapakina', scraper: smakapakina_1.scrapeSmakapakina },

                ];

        console.log(`✓ Created expected results for ${name}: ${menuItems.length} items`); for (const { name, scraper } of scrapers) {

        } catch (error) {
            try {

                console.error(`✗ Failed to create expected results for ${name}:`, error.message); console.log(`Running ${name} scraper...`);

            }            const menuItems = await scraper();

        } const expectedFilePath = path_1.default.join(resultsDir, `${name}.json`);

    }            fs_1.default.writeFileSync(expectedFilePath, JSON.stringify(menuItems, null, 2));

    console.log(`✓ Created expected results for ${name}: ${menuItems.length} items`);

    createExpectedResults();
}
        catch (error) {
    console.error(`✗ Failed to create expected results for ${name}:`, error);
}
    }
}
createExpectedResults();
