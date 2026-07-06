import * as cheerio from 'cheerio';
import { AnyNode, Element } from 'domhandler';
import { MenuItem } from '../types/menu';

export interface DayGroup {
    day: string;
    elements: cheerio.Cheerio<AnyNode>;
}

interface ParseDayGroupedHtmlOptions {
    groups: DayGroup[];
    parseElement: (element: Element, day: string) => Omit<MenuItem, 'day'> | null;
}

/**
 * Shared helper for scrapers that structure menu items as "day group -> list of dish elements".
 */
export function parseDayGroupedHtml({ groups, parseElement }: ParseDayGroupedHtmlOptions): MenuItem[] {
    const menuItems: MenuItem[] = [];

    groups.forEach((group) => {
        group.elements.each((_: number, element: AnyNode) => {
            const parsed = parseElement(element as Element, group.day);
            if (!parsed) {
                return;
            }
            menuItems.push({
                ...parsed,
                day: group.day
            });
        });
    });

    return menuItems;
}
