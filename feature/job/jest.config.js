/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(test|spec).{ts,tsx,js,jsx}'],
  testPathIgnorePatterns: ['/dist/', '\\.d\\.ts$'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'sql'],

  // Deploys the published platform surface into a template database once for the
  // whole run; each suite then clones it, so a suite's database is a file copy.
  globalSetup: '@constructive-functions/harness/jest-global-setup'
};
