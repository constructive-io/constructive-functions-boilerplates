/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(test|spec).{ts,tsx,js,jsx}'],
  // `.image/` is the staged python image and its venv — thousands of installed
  // files jest would otherwise crawl on every run.
  testPathIgnorePatterns: ['/dist/', '/.image/', '\\.d\\.ts$'],
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/.image/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'sql'],

  // Deploys the stack `fun up` deploys into a template database once for the
  // whole run; each suite then clones it, so a suite's database is a file copy.
  globalSetup: '<rootDir>/../../jest.globalSetup.ts',
  globalTeardown: '<rootDir>/../../jest.globalTeardown.ts'
};
