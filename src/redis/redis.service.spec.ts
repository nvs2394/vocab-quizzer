import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

// Mock Redis client
jest.mock('ioredis');

describe('RedisService', () => {
  let service: RedisService;
  let mockRedisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    // Create a mock Redis client with all needed methods
    mockRedisClient = {
      on: jest.fn(),
      quit: jest.fn().mockResolvedValue('OK'),
      setex: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      ttl: jest.fn().mockResolvedValue(3600),
      sadd: jest.fn().mockResolvedValue(1),
      smembers: jest.fn().mockResolvedValue([]),
      srem: jest.fn().mockResolvedValue(1),
      scard: jest.fn().mockResolvedValue(0),
      zadd: jest.fn().mockResolvedValue(1),
      zincrby: jest.fn().mockResolvedValue('10'),
      zscore: jest.fn().mockResolvedValue('10'),
      zrevrank: jest.fn().mockResolvedValue(0),
      zrevrange: jest.fn().mockResolvedValue([]),
      hset: jest.fn().mockResolvedValue(1),
      hget: jest.fn(),
      hgetall: jest.fn().mockResolvedValue({}),
      exists: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue([]),
      info: jest.fn().mockResolvedValue('# Server\nredis_version:6.0.0'),
    } as any;

    // Mock the Redis constructor to return our mock client
    (Redis as unknown as jest.Mock).mockImplementation(() => mockRedisClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                REDIS_HOST: 'localhost',
                REDIS_PORT: 6379,
                REDIS_DB: 0,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize Redis connection', () => {
      expect(Redis).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'localhost',
          port: 6379,
          db: 0,
        }),
      );
    });

    it('should register event listeners', () => {
      expect(mockRedisClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('ready', expect.any(Function));
    });
  });

  describe('Quiz Session Operations', () => {
    describe('createQuizSession', () => {
      it('should create a quiz session with TTL', async () => {
        const quizId = 'QUIZ123';
        const sessionData = { quizId, title: 'Test Quiz' };

        await service.createQuizSession(quizId, sessionData, 3600);

        expect(mockRedisClient.setex).toHaveBeenCalledWith(
          'quiz:session:QUIZ123',
          3600,
          JSON.stringify(sessionData),
        );
      });
    });

    describe('getQuizSession', () => {
      it('should return parsed quiz session data', async () => {
        const sessionData = { quizId: 'QUIZ123', title: 'Test Quiz' };
        mockRedisClient.get.mockResolvedValue(JSON.stringify(sessionData));

        const result = await service.getQuizSession('QUIZ123');

        expect(mockRedisClient.get).toHaveBeenCalledWith('quiz:session:QUIZ123');
        expect(result).toEqual(sessionData);
      });

      it('should return null if quiz session does not exist', async () => {
        mockRedisClient.get.mockResolvedValue(null);

        const result = await service.getQuizSession('NONEXISTENT');

        expect(result).toBeNull();
      });
    });

    describe('updateQuizSession', () => {
      it('should update quiz session preserving TTL', async () => {
        const sessionData = { quizId: 'QUIZ123', status: 'IN_PROGRESS' };
        mockRedisClient.ttl.mockResolvedValue(1800);

        await service.updateQuizSession('QUIZ123', sessionData);

        expect(mockRedisClient.ttl).toHaveBeenCalledWith('quiz:session:QUIZ123');
        expect(mockRedisClient.setex).toHaveBeenCalledWith(
          'quiz:session:QUIZ123',
          1800,
          JSON.stringify(sessionData),
        );
      });

      it('should set without TTL if no TTL exists', async () => {
        const sessionData = { quizId: 'QUIZ123' };
        mockRedisClient.ttl.mockResolvedValue(-1);

        await service.updateQuizSession('QUIZ123', sessionData);

        expect(mockRedisClient.set).toHaveBeenCalledWith(
          'quiz:session:QUIZ123',
          JSON.stringify(sessionData),
        );
      });
    });

    describe('deleteQuizSession', () => {
      it('should delete quiz session', async () => {
        await service.deleteQuizSession('QUIZ123');

        expect(mockRedisClient.del).toHaveBeenCalledWith('quiz:session:QUIZ123');
      });
    });
  });

  describe('Participant Operations', () => {
    describe('addParticipant', () => {
      it('should add participant to set and store user data', async () => {
        const userData = { userId: 'user1', username: 'John' };

        await service.addParticipant('QUIZ123', 'user1', userData);

        expect(mockRedisClient.sadd).toHaveBeenCalledWith('quiz:participants:QUIZ123', 'user1');
        expect(mockRedisClient.set).toHaveBeenCalledWith(
          'quiz:participant:QUIZ123:user1',
          JSON.stringify(userData),
        );
      });
    });

    describe('getParticipants', () => {
      it('should return list of participant user IDs', async () => {
        mockRedisClient.smembers.mockResolvedValue(['user1', 'user2', 'user3']);

        const result = await service.getParticipants('QUIZ123');

        expect(mockRedisClient.smembers).toHaveBeenCalledWith('quiz:participants:QUIZ123');
        expect(result).toEqual(['user1', 'user2', 'user3']);
      });
    });

    describe('getParticipant', () => {
      it('should return participant data', async () => {
        const userData = { userId: 'user1', username: 'John', score: 100 };
        mockRedisClient.get.mockResolvedValue(JSON.stringify(userData));

        const result = await service.getParticipant('QUIZ123', 'user1');

        expect(mockRedisClient.get).toHaveBeenCalledWith('quiz:participant:QUIZ123:user1');
        expect(result).toEqual(userData);
      });

      it('should return null if participant does not exist', async () => {
        mockRedisClient.get.mockResolvedValue(null);

        const result = await service.getParticipant('QUIZ123', 'nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('getParticipantCount', () => {
      it('should return count of participants', async () => {
        mockRedisClient.scard.mockResolvedValue(5);

        const result = await service.getParticipantCount('QUIZ123');

        expect(mockRedisClient.scard).toHaveBeenCalledWith('quiz:participants:QUIZ123');
        expect(result).toBe(5);
      });
    });

    describe('removeParticipant', () => {
      it('should remove participant from set and delete user data', async () => {
        await service.removeParticipant('QUIZ123', 'user1');

        expect(mockRedisClient.srem).toHaveBeenCalledWith('quiz:participants:QUIZ123', 'user1');
        expect(mockRedisClient.del).toHaveBeenCalledWith('quiz:participant:QUIZ123:user1');
      });
    });
  });

  describe('Score Operations', () => {
    describe('updateScore', () => {
      it('should update score in sorted set', async () => {
        await service.updateScore('QUIZ123', 'user1', 100);

        expect(mockRedisClient.zadd).toHaveBeenCalledWith('quiz:scores:QUIZ123', 100, 'user1');
      });
    });

    describe('incrementScore', () => {
      it('should atomically increment score', async () => {
        mockRedisClient.zincrby.mockResolvedValue('110');

        const newScore = await service.incrementScore('QUIZ123', 'user1', 10);

        expect(mockRedisClient.zincrby).toHaveBeenCalledWith('quiz:scores:QUIZ123', 10, 'user1');
        expect(newScore).toBe(110);
      });
    });

    describe('getScore', () => {
      it('should return user score', async () => {
        mockRedisClient.zscore.mockResolvedValue('150');

        const score = await service.getScore('QUIZ123', 'user1');

        expect(mockRedisClient.zscore).toHaveBeenCalledWith('quiz:scores:QUIZ123', 'user1');
        expect(score).toBe(150);
      });

      it('should return 0 if user has no score', async () => {
        mockRedisClient.zscore.mockResolvedValue(null);

        const score = await service.getScore('QUIZ123', 'user1');

        expect(score).toBe(0);
      });
    });

    describe('getRank', () => {
      it('should return user rank (0-based)', async () => {
        mockRedisClient.zrevrank.mockResolvedValue(2);

        const rank = await service.getRank('QUIZ123', 'user1');

        expect(mockRedisClient.zrevrank).toHaveBeenCalledWith('quiz:scores:QUIZ123', 'user1');
        expect(rank).toBe(2);
      });

      it('should return null if user not found', async () => {
        mockRedisClient.zrevrank.mockResolvedValue(null);

        const rank = await service.getRank('QUIZ123', 'nonexistent');

        expect(rank).toBeNull();
      });
    });
  });

  describe('Leaderboard Operations', () => {
    describe('getLeaderboard', () => {
      it('should return top N participants with scores and ranks', async () => {
        mockRedisClient.zrevrange.mockResolvedValue([
          'user1',
          '150',
          'user2',
          '120',
          'user3',
          '100',
        ]);

        const leaderboard = await service.getLeaderboard('QUIZ123', 3);

        expect(mockRedisClient.zrevrange).toHaveBeenCalledWith(
          'quiz:scores:QUIZ123',
          0,
          2,
          'WITHSCORES',
        );
        expect(leaderboard).toEqual([
          { userId: 'user1', score: 150, rank: 1 },
          { userId: 'user2', score: 120, rank: 2 },
          { userId: 'user3', score: 100, rank: 3 },
        ]);
      });
    });

    describe('getFullLeaderboard', () => {
      it('should return full leaderboard with participant details', async () => {
        mockRedisClient.zrevrange.mockResolvedValue(['user1', '150', 'user2', '120']);
        mockRedisClient.get
          .mockResolvedValueOnce(JSON.stringify({ username: 'Alice' }))
          .mockResolvedValueOnce(JSON.stringify({ username: 'Bob' }));

        const leaderboard = await service.getFullLeaderboard('QUIZ123');

        expect(leaderboard).toEqual([
          { userId: 'user1', username: 'Alice', score: 150, rank: 1 },
          { userId: 'user2', username: 'Bob', score: 120, rank: 2 },
        ]);
      });
    });
  });

  describe('Answer Tracking Operations', () => {
    describe('storeAnswer', () => {
      it('should store user answer in hash', async () => {
        const answer = { answer: 'Joyful', correct: true, earnedPoints: 10 };

        await service.storeAnswer('QUIZ123', 'user1', 'q1', answer);

        expect(mockRedisClient.hset).toHaveBeenCalledWith(
          'quiz:answers:QUIZ123:user1',
          'q1',
          JSON.stringify(answer),
        );
      });
    });

    describe('getAnswer', () => {
      it('should return parsed answer', async () => {
        const answer = { answer: 'Joyful', correct: true };
        mockRedisClient.hget.mockResolvedValue(JSON.stringify(answer));

        const result = await service.getAnswer('QUIZ123', 'user1', 'q1');

        expect(mockRedisClient.hget).toHaveBeenCalledWith('quiz:answers:QUIZ123:user1', 'q1');
        expect(result).toEqual(answer);
      });

      it('should return null if answer not found', async () => {
        mockRedisClient.hget.mockResolvedValue(null);

        const result = await service.getAnswer('QUIZ123', 'user1', 'q1');

        expect(result).toBeNull();
      });
    });

    describe('getAllAnswers', () => {
      it('should return all answers for a user', async () => {
        const answers = {
          q1: JSON.stringify({ answer: 'Joyful', correct: true }),
          q2: JSON.stringify({ answer: 'Large', correct: true }),
        };
        mockRedisClient.hgetall.mockResolvedValue(answers);

        const result = await service.getAllAnswers('QUIZ123', 'user1');

        expect(result).toEqual({
          q1: { answer: 'Joyful', correct: true },
          q2: { answer: 'Large', correct: true },
        });
      });
    });
  });

  describe('Question State Operations', () => {
    describe('setCurrentQuestion', () => {
      it('should set current question index', async () => {
        await service.setCurrentQuestion('QUIZ123', 3);

        expect(mockRedisClient.set).toHaveBeenCalledWith('quiz:current_question:QUIZ123', '3');
      });
    });

    describe('getCurrentQuestion', () => {
      it('should return current question index', async () => {
        mockRedisClient.get.mockResolvedValue('3');

        const index = await service.getCurrentQuestion('QUIZ123');

        expect(mockRedisClient.get).toHaveBeenCalledWith('quiz:current_question:QUIZ123');
        expect(index).toBe(3);
      });

      it('should return 0 if no current question is set', async () => {
        mockRedisClient.get.mockResolvedValue(null);

        const index = await service.getCurrentQuestion('QUIZ123');

        expect(index).toBe(0);
      });
    });
  });

  describe('Utility Operations', () => {
    describe('quizExists', () => {
      it('should return true if quiz exists', async () => {
        mockRedisClient.exists.mockResolvedValue(1);

        const exists = await service.quizExists('QUIZ123');

        expect(mockRedisClient.exists).toHaveBeenCalledWith('quiz:session:QUIZ123');
        expect(exists).toBe(true);
      });

      it('should return false if quiz does not exist', async () => {
        mockRedisClient.exists.mockResolvedValue(0);

        const exists = await service.quizExists('NONEXISTENT');

        expect(exists).toBe(false);
      });
    });

    describe('cleanupQuiz', () => {
      it('should delete all quiz-related keys', async () => {
        const keys = ['quiz:session:QUIZ123', 'quiz:participants:QUIZ123', 'quiz:scores:QUIZ123'];
        mockRedisClient.keys.mockResolvedValue(keys);

        await service.cleanupQuiz('QUIZ123');

        expect(mockRedisClient.keys).toHaveBeenCalledWith('quiz:*:QUIZ123*');
        expect(mockRedisClient.del).toHaveBeenCalledWith(...keys);
      });
    });

    describe('getInfo', () => {
      it('should return Redis server info', async () => {
        const info = '# Server\nredis_version:6.0.0';
        mockRedisClient.info.mockResolvedValue(info);

        const result = await service.getInfo();

        expect(result).toBe(info);
      });
    });
  });
});
