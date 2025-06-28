// tests/unit/generateRoomId.test.js
const { generateRoomId } = require('../../utils');

describe('generateRoomId', () => {
    it('returns consistent ID regardless of order', () => {
      expect(generateRoomId('5', '10')).toBe('5_10');
      expect(generateRoomId('10', '5')).toBe('5_10');
    });
  
    it('throws if IDs are not positive integers', () => {
      expect(() => generateRoomId('-1', '2')).toThrow();
      expect(() => generateRoomId('abc', '3')).toThrow();
      expect(() => generateRoomId('0', '4')).toThrow();
    });
  
    it('parses numeric strings correctly', () => {
      expect(generateRoomId('001', '02')).toBe('1_2');
    });
  });