module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/test'],
    testMatch: [
        '**/test/contract/**/*.test.ts'
    ],
    testPathIgnorePatterns: ['.*\\.manual\\.test\\.ts$'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/debug-*.ts',
        '!src/test-*.ts',
        '!src/test/**',
    ],
    setupFilesAfterEnv: ['<rootDir>/test/setup/jest.setup.ts'],
    testTimeout: 30000 // Longer timeout for external dependencies
};
