// Simple test to verify Jest is working
describe('Basic Test Suite', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('success');
    expect(result).toBe('success');
  });

  it('should work with objects', () => {
    const obj = { name: 'test', value: 123 };
    expect(obj).toHaveProperty('name', 'test');
    expect(obj.value).toBe(123);
  });
});