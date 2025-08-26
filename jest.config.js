module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/test/**/*.test.ts'],
    testPathIgnorePatterns: ['.*\\.manual\\.test\\.ts$'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/debug-*.ts',
        '!src/test-*.ts',
        '!src/test/**/*.manual.test.ts',
    ],
    testTimeout: 30000,
};
