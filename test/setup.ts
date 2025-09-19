// Jest setup file for acceptance tests
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Mock axios to serve local fixture files instead of making HTTP requests
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Helper function to load fixture files
function loadFixture(filename: string): string {
    const fixturePath = path.join(__dirname, 'fixtures', filename);
    return fs.readFileSync(fixturePath, 'utf8');
}

// Helper function to load binary fixture files (like PDFs)
function loadBinaryFixture(filename: string): Buffer {
    const fixturePath = path.join(__dirname, 'fixtures', filename);
    return fs.readFileSync(fixturePath);
}

// Mock axios.get to return fixture data based on URL
mockedAxios.get.mockImplementation((url: string, config?: any) => {
    // Handle different restaurant URLs
    if (url.includes('restaurangedison.se/lunch')) {
        return Promise.resolve({
            data: loadFixture('edison.html'),
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
        });
    }

    if (url.includes('brickseatery.se/lunch')) {
        return Promise.resolve({
            data: loadFixture('bricks.html'),
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
        });
    }

    if (url.includes('kantinlund.se')) {
        return Promise.resolve({
            data: loadFixture('kantin.html'),
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
        });
    }

    if (url.includes('smakapakina.se') || url.includes('wixrestaurants.com')) {
        return Promise.resolve({
            data: loadFixture('smakapakina.html'),
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
        });
    }

    if (url.includes('eatery.se') && url.includes('lund')) {
        return Promise.resolve({
            data: loadFixture('eatery-main.html'),
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
        });
    }

    if (url.includes('nordrest.se/restaurang/food-hall')) {
        return Promise.resolve({
            data: loadFixture('foodhall.html'),
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
        });
    }

    // Handle PDF downloads for Eatery
    if (url.includes('.pdf')) {
        const responseType = config?.responseType;
        if (responseType === 'arraybuffer') {
            return Promise.resolve({
                data: loadBinaryFixture('eatery-menu.pdf'),
                status: 200,
                statusText: 'OK',
                headers: {},
                config: config || {}
            });
        }
    }

    // Default fallback for unmocked URLs
    return Promise.reject(new Error(`Unmocked URL: ${url}`));
});

export { loadFixture, loadBinaryFixture };