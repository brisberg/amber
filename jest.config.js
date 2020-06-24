module.exports = {
  // -- Default JestSettings (brisberg/typescript-pkg)

  // An array of glob patterns indicating a set of files for which coverage
  // information should be collected
  collectCoverageFrom: ['src/**/*.{js,ts}'],

  // An array of regexp pattern strings used to skip coverage collection
  // coveragePathIgnorePatterns: ['/lib/', '\\.d\\.ts$'],

  // An array of directory names to be searched recursively up from the
  // requiring module's location
  moduleDirectories: ['node_modules', 'src'],

  // A preset that is used as a base for Jest's configuration
  preset: 'ts-jest',

  // The test environment that will be used for testing
  // testEnvironment: '',

  // The glob patterns Jest uses to detect test files
  testMatch: ['**/*.spec.ts', '!**/node_modules/**', '!**/lib/**'],

  // -- Add package specific configurations below here

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    '/dist/',
    '\\.d\\.ts$',
    'src/utils/ErrorMapper.ts',
  ],

  // The test environment that will be used for testing
  testEnvironment: 'screeps-jest',
};
