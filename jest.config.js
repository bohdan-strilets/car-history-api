module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', {
      tsconfig: {
        baseUrl: '.',
        jsx: 'react-jsx',
        paths: {
          '@modules/*': ['./src/modules/*'],
          '@common/*': ['./src/common/*'],
          '@config/*': ['./src/config/*'],
          '@prisma/*': ['./src/prisma/*'],
        },
      },
    }],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/../jest.setup.js'],
  moduleNameMapper: {
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@prisma/prisma.service$': '<rootDir>/prisma/prisma.service',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
