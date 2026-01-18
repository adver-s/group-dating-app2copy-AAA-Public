// Jest setup file

// Mock fetch globally
global.fetch = jest.fn();

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    team: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    teamMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    teamPhoto: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    teamWeekday: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    teamHobby: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    teamPrefecture: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    groupMatchingFlow: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    userHiddenGroup: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    chatRoom: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
  })),
}));

// Mock local NoSQL storage
jest.mock('../apps/api/utils/local-nosql', () => ({
  userJudgementHistory: {
    insert: jest.fn(),
    findMany: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    getAll: jest.fn(),
    clear: jest.fn(),
  },
  userJudgementLatest: {
    insert: jest.fn(),
    findMany: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    getAll: jest.fn(),
    clear: jest.fn(),
  },
  chatMessages: {
    insert: jest.fn(),
    findMany: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    getAll: jest.fn(),
    clear: jest.fn(),
  },
  chatReadStatus: {
    insert: jest.fn(),
    findMany: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    getAll: jest.fn(),
    clear: jest.fn(),
  },
  saveUserJudgementHistory: jest.fn(),
  saveUserJudgementLatest: jest.fn(),
  saveChatMessage: jest.fn(),
  updateChatReadStatus: jest.fn(),
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 