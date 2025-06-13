/**
 * @jest-environment jsdom
 */
import '../utils/fetch-polyfill';

describe('Simple Test', () => {
    test('should pass', () => {
        expect(true).toBe(true);
    });
});
