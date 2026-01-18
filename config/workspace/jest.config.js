const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: require('path').join(__dirname, '../../apps/web'),
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/utils/(.*)$': '<rootDir>/../../utils/$1',
    '^@/types/(.*)$': '<rootDir>/../../types/$1',
    '^@/prisma$': '<rootDir>/../../apps/api/lib/prisma',
    '^@/middleware/(.*)$': '<rootDir>/apps/web/middleware/$1',
    '^@/app/(.*)$': '<rootDir>/apps/web/app/$1',
    '^@/components/(.*)$': '<rootDir>/apps/web/components/$1',
    '^@/lib/(.*)$': '<rootDir>/apps/web/lib/$1',
    '^@repo/schema$': '<rootDir>/../../packages/schema/dist/index',
    '^@repo/ui$': '<rootDir>/../../packages/ui/dist/index',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/apps/web/tests/'],
  collectCoverageFrom: [
    'apps/web/app/**/*.{js,jsx,ts,tsx}',
    'apps/web/components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 