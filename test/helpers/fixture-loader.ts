import * as fs from 'fs';
import * as path from 'path';

/**
 * Load a test fixture file
 * @param fixturePath - Relative path from fixtures directory (e.g., 'html/bricks-menu.html')
 * @returns File contents as string
 */
export function loadFixture(fixturePath: string): string {
    const fullPath = path.join(__dirname, '..', 'fixtures', fixturePath);

    if (!fs.existsSync(fullPath)) {
        throw new Error(`Fixture not found: ${fixturePath} (looked in ${fullPath})`);
    }

    return fs.readFileSync(fullPath, 'utf8');
}

/**
 * Load a binary fixture file (e.g., PDF)
 * @param fixturePath - Relative path from fixtures directory
 * @returns File contents as Buffer
 */
export function loadBinaryFixture(fixturePath: string): Buffer {
    const fullPath = path.join(__dirname, '..', 'fixtures', fixturePath);

    if (!fs.existsSync(fullPath)) {
        throw new Error(`Fixture not found: ${fixturePath} (looked in ${fullPath})`);
    }

    return fs.readFileSync(fullPath);
}

/**
 * Save content as a fixture file (useful for updating fixtures)
 * @param fixturePath - Relative path from fixtures directory
 * @param content - Content to save
 */
export function saveFixture(fixturePath: string, content: string): void {
    const fullPath = path.join(__dirname, '..', 'fixtures', fixturePath);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
}

/**
 * Get list of available fixtures in a directory
 * @param directory - Directory within fixtures (e.g., 'html', 'pdf')
 * @returns Array of fixture filenames
 */
export function listFixtures(directory: string): string[] {
    const fullPath = path.join(__dirname, '..', 'fixtures', directory);

    if (!fs.existsSync(fullPath)) {
        return [];
    }

    return fs.readdirSync(fullPath).filter(file => !file.startsWith('.'));
}
