// eslint-disable-next-line @typescript-eslint/no-var-requires
module.exports = Object.assign({}, require('./jest.config'), {
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '/**/*.test.ts',
    '!**/unit/**',  // Unit tests deprecated
    '!**/node_modules/**',
    '!**/dist/**',
  ],
});
