/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  preset: 'ts-jest',
  testEnvironment: "node",
  moduleFileExtensions: ['js', 'ts', 'tsx'],
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
};