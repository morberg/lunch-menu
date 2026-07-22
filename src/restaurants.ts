import { scrapeBricksMenu } from './scrapers/bricks';
import { scrapeEatery } from './scrapers/eatery';
import { scrapeEdisonMenu } from './scrapers/edison';
import { scrapeFoodHallMenu } from './scrapers/foodhall';
import { scrapeGrendenMenu } from './scrapers/grenden';
import { scrapeKantinMenu } from './scrapers/kantin';
import { scrapeLinneaBasilikaMenu } from './scrapers/linneabasilika';
import { scrapeSmakapakina } from './scrapers/smakapakina';
import { scrapeTroppoMenu } from './scrapers/troppo';
import { MenuItem } from './types/menu';

interface RestaurantDefinition {
    key: string;
    name: string;
    url: string;
    scrape: () => Promise<MenuItem[]>;
}

export const RESTAURANTS = [
    { key: 'edison', name: 'Edison', url: 'https://restaurangedison.se/lunch/', scrape: scrapeEdisonMenu },
    { key: 'grenden', name: 'Grenden', url: 'https://www.nordrest.se/restaurang/grenden/', scrape: scrapeGrendenMenu },
    { key: 'foodhall', name: 'Food Hall', url: 'https://www.nordrest.se/restaurang/food-hall/', scrape: scrapeFoodHallMenu },
    { key: 'bricks', name: 'Bricks Eatery', url: 'https://brickseatery.se/lunch/', scrape: scrapeBricksMenu },
    { key: 'kantin', name: 'Kantin', url: 'https://www.kantinlund.se/', scrape: scrapeKantinMenu },
    { key: 'smakapakina', name: 'Smaka på Kina', url: 'https://www.smakapakina.se/meny', scrape: scrapeSmakapakina },
    { key: 'eatery', name: 'Eatery', url: 'https://eatery.se/anlaggningar/lund', scrape: scrapeEatery },
    { key: 'linneabasilika', name: 'Linnea & Basilika', url: 'https://www.linneabasilika.se/lund-brunnshog/', scrape: scrapeLinneaBasilikaMenu },
    { key: 'troppo', name: 'Troppo', url: 'https://www.troppo.se/lunch', scrape: scrapeTroppoMenu }
] as const satisfies readonly RestaurantDefinition[];

export type RestaurantKey = typeof RESTAURANTS[number]['key'];

export interface RestaurantMenu {
    key: RestaurantKey;
    name: string;
    url: string;
    menu: MenuItem[];
}