describe('Basic Test Suite', () => {
    it('should pass a simple test', () => {
        expect(1 + 1).toBe(2);
    });

    it('should validate string operations', () => {
        const testString = 'Hello World';
        expect(testString).toContain('World');
        expect(testString.length).toBe(11);
    });
});
