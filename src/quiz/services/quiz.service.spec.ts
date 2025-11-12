import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { RedisService } from '../../redis/redis.service';
import { QuestionService } from './question.service';
import { QuizStatus } from '../interfaces/quiz.interface';

describe('QuizService', () => {
  let service: QuizService;
  let redisService: jest.Mocked<RedisService>;
  let questionService: jest.Mocked<QuestionService>;

  const mockQuestions = [
    {
      id: 'q1',
      text: 'What does "happy" mean?',
      options: ['Sad', 'Joyful', 'Angry', 'Tired'],
      correctAnswer: 'Joyful',
      difficulty: 'easy' as const,
      category: 'emotions',
      points: 10,
    },
    {
      id: 'q2',
      text: 'Choose the synonym of "big"?',
      options: ['Small', 'Large', 'Tiny', 'Little'],
      correctAnswer: 'Large',
      difficulty: 'easy' as const,
      category: 'adjectives',
      points: 10,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        {
          provide: RedisService,
          useValue: {
            createQuizSession: jest.fn(),
            getQuizSession: jest.fn(),
            updateQuizSession: jest.fn(),
            addParticipant: jest.fn(),
            getParticipant: jest.fn(),
            getParticipantCount: jest.fn(),
            getParticipants: jest.fn(),
            removeParticipant: jest.fn(),
            updateScore: jest.fn(),
            incrementScore: jest.fn(),
            getScore: jest.fn(),
            getRank: jest.fn(),
            getFullLeaderboard: jest.fn(),
            getAllAnswers: jest.fn(),
            getAnswer: jest.fn(),
            storeAnswer: jest.fn(),
            setCurrentQuestion: jest.fn(),
            getCurrentQuestion: jest.fn(),
            quizExists: jest.fn(),
          },
        },
        {
          provide: QuestionService,
          useValue: {
            getBalancedQuestions: jest.fn(),
            getQuestionById: jest.fn(),
            validateAnswer: jest.fn(),
            calculatePoints: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                QUIZ_SESSION_TTL: 3600,
                MAX_PARTICIPANTS_PER_QUIZ: 100,
                SCORE_PER_CORRECT_ANSWER: 10,
                TIME_BONUS_ENABLED: true,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
    redisService = module.get(RedisService);
    questionService = module.get(QuestionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createQuiz', () => {
    it('should create a new quiz session', async () => {
      questionService.getBalancedQuestions.mockReturnValue(mockQuestions);

      const quiz = await service.createQuiz('Test Quiz', 2);

      expect(quiz).toBeDefined();
      expect(quiz.quizId).toBeDefined();
      expect(quiz.title).toBe('Test Quiz');
      expect(quiz.status).toBe(QuizStatus.WAITING);
      expect(quiz.questions).toEqual(mockQuestions);
      expect(redisService.createQuizSession).toHaveBeenCalledWith(quiz.quizId, quiz, 3600);
    });

    it('should generate unique quiz IDs', async () => {
      questionService.getBalancedQuestions.mockReturnValue(mockQuestions);

      const quiz1 = await service.createQuiz('Quiz 1', 2);
      const quiz2 = await service.createQuiz('Quiz 2', 2);

      expect(quiz1.quizId).not.toBe(quiz2.quizId);
    });
  });

  describe('getQuizSession', () => {
    it('should return quiz session if exists', async () => {
      const mockSession = {
        quizId: 'QUIZ123',
        title: 'Test Quiz',
        status: QuizStatus.WAITING,
        questions: mockQuestions,
        currentQuestionIndex: 0,
        createdAt: new Date(),
        maxParticipants: 100,
      };

      redisService.getQuizSession.mockResolvedValue(mockSession);

      const result = await service.getQuizSession('QUIZ123');

      expect(result).toEqual(mockSession);
      expect(redisService.getQuizSession).toHaveBeenCalledWith('QUIZ123');
    });

    it('should throw NotFoundException if quiz does not exist', async () => {
      redisService.getQuizSession.mockResolvedValue(null);

      await expect(service.getQuizSession('NONEXISTENT')).rejects.toThrow(NotFoundException);
    });
  });

  describe('joinQuiz', () => {
    const mockSession = {
      quizId: 'QUIZ123',
      title: 'Test Quiz',
      status: QuizStatus.WAITING,
      questions: mockQuestions,
      currentQuestionIndex: 0,
      createdAt: new Date(),
      maxParticipants: 100,
    };

    beforeEach(() => {
      redisService.getQuizSession.mockResolvedValue(mockSession);
    });

    it('should allow user to join quiz', async () => {
      redisService.getParticipantCount.mockResolvedValue(5);
      redisService.getParticipant.mockResolvedValue(null);

      const result = await service.joinQuiz('QUIZ123', 'user1', 'Alice', 'socket1');

      expect(result).toEqual(mockSession);
      expect(redisService.addParticipant).toHaveBeenCalledWith(
        'QUIZ123',
        'user1',
        expect.objectContaining({
          userId: 'user1',
          username: 'Alice',
          socketId: 'socket1',
          score: 0,
          answersSubmitted: 0,
        }),
      );
      expect(redisService.updateScore).toHaveBeenCalledWith('QUIZ123', 'user1', 0);
    });

    it('should throw BadRequestException if quiz is full', async () => {
      redisService.getParticipantCount.mockResolvedValue(100);

      await expect(service.joinQuiz('QUIZ123', 'user1', 'Alice', 'socket1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if quiz is completed', async () => {
      redisService.getQuizSession.mockResolvedValue({
        ...mockSession,
        status: QuizStatus.COMPLETED,
      });

      await expect(service.joinQuiz('QUIZ123', 'user1', 'Alice', 'socket1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update socket ID for existing participant (reconnection)', async () => {
      const existingParticipant = {
        userId: 'user1',
        username: 'Alice',
        socketId: 'old-socket',
        joinedAt: new Date(),
        score: 50,
        answersSubmitted: 3,
      };

      redisService.getParticipantCount.mockResolvedValue(5);
      redisService.getParticipant.mockResolvedValue(existingParticipant);

      const result = await service.joinQuiz('QUIZ123', 'user1', 'Alice', 'new-socket');

      expect(result).toEqual(mockSession);
      expect(redisService.addParticipant).toHaveBeenCalledWith(
        'QUIZ123',
        'user1',
        expect.objectContaining({
          socketId: 'new-socket',
          score: 50,
        }),
      );
    });
  });

  describe('startQuiz', () => {
    it('should start quiz successfully', async () => {
      const mockSession = {
        quizId: 'QUIZ123',
        title: 'Test Quiz',
        status: QuizStatus.WAITING,
        questions: mockQuestions,
        currentQuestionIndex: 0,
        createdAt: new Date(),
        maxParticipants: 100,
      };

      redisService.getQuizSession.mockResolvedValue(mockSession);
      redisService.getParticipantCount.mockResolvedValue(5);

      const result = await service.startQuiz('QUIZ123');

      expect(result.status).toBe(QuizStatus.IN_PROGRESS);
      expect(result.startTime).toBeDefined();
      expect(redisService.updateQuizSession).toHaveBeenCalled();
      expect(redisService.setCurrentQuestion).toHaveBeenCalledWith('QUIZ123', 0);
    });

    it('should throw BadRequestException if quiz already started', async () => {
      redisService.getQuizSession.mockResolvedValue({
        quizId: 'QUIZ123',
        status: QuizStatus.IN_PROGRESS,
        questions: mockQuestions,
        currentQuestionIndex: 0,
        createdAt: new Date(),
        maxParticipants: 100,
      });

      await expect(service.startQuiz('QUIZ123')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no participants', async () => {
      redisService.getQuizSession.mockResolvedValue({
        quizId: 'QUIZ123',
        status: QuizStatus.WAITING,
        questions: mockQuestions,
        currentQuestionIndex: 0,
        createdAt: new Date(),
        maxParticipants: 100,
      });
      redisService.getParticipantCount.mockResolvedValue(0);

      await expect(service.startQuiz('QUIZ123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCurrentQuestion', () => {
    it('should return current question without correct answer', async () => {
      const mockSession = {
        quizId: 'QUIZ123',
        status: QuizStatus.IN_PROGRESS,
        questions: mockQuestions,
        currentQuestionIndex: 0,
        createdAt: new Date(),
        maxParticipants: 100,
      };

      redisService.getQuizSession.mockResolvedValue(mockSession);
      redisService.getCurrentQuestion.mockResolvedValue(0);

      const result = await service.getCurrentQuestion('QUIZ123');

      expect(result).toBeDefined();
      expect(result.id).toBe('q1');
      expect(result.correctAnswer).toBe(''); // Should be hidden
    });

    it('should throw BadRequestException if no more questions', async () => {
      const mockSession = {
        quizId: 'QUIZ123',
        status: QuizStatus.IN_PROGRESS,
        questions: mockQuestions,
        currentQuestionIndex: 2,
        createdAt: new Date(),
        maxParticipants: 100,
      };

      redisService.getQuizSession.mockResolvedValue(mockSession);
      redisService.getCurrentQuestion.mockResolvedValue(10); // Beyond questions length

      await expect(service.getCurrentQuestion('QUIZ123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitAnswer', () => {
    const mockSession = {
      quizId: 'QUIZ123',
      status: QuizStatus.IN_PROGRESS,
      questions: mockQuestions,
      currentQuestionIndex: 0,
      createdAt: new Date(),
      maxParticipants: 100,
    };

    const mockQuestion = mockQuestions[0];

    beforeEach(() => {
      redisService.getQuizSession.mockResolvedValue(mockSession);
    });

    it('should process correct answer and update score', async () => {
      redisService.getAnswer.mockResolvedValue(null); // No duplicate
      questionService.validateAnswer.mockReturnValue(true);
      questionService.getQuestionById.mockReturnValue(mockQuestion);
      questionService.calculatePoints.mockReturnValue(15);
      redisService.incrementScore.mockResolvedValue(15);
      redisService.getRank.mockResolvedValue(0);
      redisService.getParticipant.mockResolvedValue({
        userId: 'user1',
        username: 'Alice',
        socketId: 'socket1',
        joinedAt: new Date(),
        score: 0,
        answersSubmitted: 0,
      });

      const result = await service.submitAnswer('QUIZ123', 'user1', 'q1', 'Joyful', 10);

      expect(result.correct).toBe(true);
      expect(result.earnedPoints).toBe(15);
      expect(result.currentScore).toBe(15);
      expect(result.rank).toBe(1); // 1-based rank
      expect(redisService.incrementScore).toHaveBeenCalledWith('QUIZ123', 'user1', 15);
      expect(redisService.storeAnswer).toHaveBeenCalled();
    });

    it('should process incorrect answer with 0 points', async () => {
      redisService.getAnswer.mockResolvedValue(null);
      questionService.validateAnswer.mockReturnValue(false);
      questionService.getQuestionById.mockReturnValue(mockQuestion);
      questionService.calculatePoints.mockReturnValue(0);
      redisService.getScore.mockResolvedValue(10);
      redisService.getRank.mockResolvedValue(3);
      redisService.getParticipant.mockResolvedValue({
        userId: 'user1',
        username: 'Alice',
        socketId: 'socket1',
        joinedAt: new Date(),
        score: 10,
        answersSubmitted: 1,
      });

      const result = await service.submitAnswer('QUIZ123', 'user1', 'q1', 'Sad', 10);

      expect(result.correct).toBe(false);
      expect(result.earnedPoints).toBe(0);
      expect(redisService.incrementScore).not.toHaveBeenCalled();
    });

    it('should return cached result for duplicate submission (idempotency)', async () => {
      const cachedAnswer = {
        answer: 'Joyful',
        correct: true,
        correctAnswer: 'Joyful',
        earnedPoints: 15,
        timeTaken: 10,
      };

      redisService.getAnswer.mockResolvedValue(cachedAnswer);
      redisService.getScore.mockResolvedValue(15);
      redisService.getRank.mockResolvedValue(0);

      const result = await service.submitAnswer('QUIZ123', 'user1', 'q1', 'Joyful', 10);

      expect(result.correct).toBe(true);
      expect(result.earnedPoints).toBe(15);
      expect(questionService.validateAnswer).not.toHaveBeenCalled();
      expect(redisService.storeAnswer).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if quiz not in progress', async () => {
      redisService.getQuizSession.mockResolvedValue({
        ...mockSession,
        status: QuizStatus.WAITING,
      });

      await expect(service.submitAnswer('QUIZ123', 'user1', 'q1', 'Joyful', 10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException for invalid question', async () => {
      redisService.getAnswer.mockResolvedValue(null);
      questionService.validateAnswer.mockReturnValue(true);
      questionService.getQuestionById.mockReturnValue(undefined);

      await expect(
        service.submitAnswer('QUIZ123', 'user1', 'invalid', 'Answer', 10),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('nextQuestion', () => {
    it('should move to next question', async () => {
      const mockSession = {
        quizId: 'QUIZ123',
        status: QuizStatus.IN_PROGRESS,
        questions: mockQuestions,
        currentQuestionIndex: 0,
        createdAt: new Date(),
        maxParticipants: 100,
      };

      redisService.getQuizSession.mockResolvedValue(mockSession);
      redisService.getCurrentQuestion.mockResolvedValue(0);

      const result = await service.nextQuestion('QUIZ123');

      expect(result).toBeDefined();
      expect(redisService.setCurrentQuestion).toHaveBeenCalledWith('QUIZ123', 1);
      expect(redisService.updateQuizSession).toHaveBeenCalled();
    });

    it('should complete quiz when no more questions', async () => {
      const mockSession = {
        quizId: 'QUIZ123',
        status: QuizStatus.IN_PROGRESS,
        questions: mockQuestions,
        currentQuestionIndex: 1,
        createdAt: new Date(),
        maxParticipants: 100,
      };

      redisService.getQuizSession.mockResolvedValue(mockSession);
      redisService.getCurrentQuestion.mockResolvedValue(1);

      const result = await service.nextQuestion('QUIZ123');

      expect(result).toBeNull();
      expect(redisService.updateQuizSession).toHaveBeenCalledWith(
        'QUIZ123',
        expect.objectContaining({
          status: QuizStatus.COMPLETED,
        }),
      );
    });
  });

  describe('getLeaderboard', () => {
    it('should return enriched leaderboard with stats', async () => {
      const mockSession = {
        quizId: 'QUIZ123',
        status: QuizStatus.IN_PROGRESS,
        questions: mockQuestions,
        currentQuestionIndex: 0,
        createdAt: new Date(),
        maxParticipants: 100,
      };

      const mockLeaderboard = [
        { userId: 'user1', username: 'Alice', score: 150, rank: 1 },
        { userId: 'user2', username: 'Bob', score: 120, rank: 2 },
      ];

      redisService.getQuizSession.mockResolvedValue(mockSession);
      redisService.getFullLeaderboard.mockResolvedValue(mockLeaderboard);
      redisService.getAllAnswers
        .mockResolvedValueOnce({
          q1: { correct: true },
          q2: { correct: true },
          q3: { correct: false },
        })
        .mockResolvedValueOnce({
          q1: { correct: true },
          q2: { correct: false },
        });

      const result = await service.getLeaderboard('QUIZ123', 2);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        userId: 'user1',
        score: 150,
        correctAnswers: 2,
        totalAnswers: 3,
      });
      expect(result[1]).toMatchObject({
        userId: 'user2',
        score: 120,
        correctAnswers: 1,
        totalAnswers: 2,
      });
    });
  });

  describe('getParticipants', () => {
    it('should return list of participants with details', async () => {
      const userIds = ['user1', 'user2'];
      const participant1 = { userId: 'user1', username: 'Alice', score: 100 };
      const participant2 = { userId: 'user2', username: 'Bob', score: 80 };

      redisService.getParticipants.mockResolvedValue(userIds);
      redisService.getParticipant
        .mockResolvedValueOnce(participant1)
        .mockResolvedValueOnce(participant2);

      const result = await service.getParticipants('QUIZ123');

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(participant1);
      expect(result).toContainEqual(participant2);
    });

    it('should filter out null participants', async () => {
      redisService.getParticipants.mockResolvedValue(['user1', 'user2', 'user3']);
      redisService.getParticipant
        .mockResolvedValueOnce({ userId: 'user1', username: 'Alice' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ userId: 'user3', username: 'Charlie' });

      const result = await service.getParticipants('QUIZ123');

      expect(result).toHaveLength(2);
      expect(result.map((p) => p.userId)).toEqual(['user1', 'user3']);
    });
  });

  describe('completeQuiz', () => {
    it('should mark quiz as completed', async () => {
      const mockSession = {
        quizId: 'QUIZ123',
        status: QuizStatus.IN_PROGRESS,
        questions: mockQuestions,
        currentQuestionIndex: 2,
        createdAt: new Date(),
        maxParticipants: 100,
      };

      redisService.getQuizSession.mockResolvedValue(mockSession);

      const result = await service.completeQuiz('QUIZ123');

      expect(result.status).toBe(QuizStatus.COMPLETED);
      expect(result.endTime).toBeDefined();
      expect(redisService.updateQuizSession).toHaveBeenCalledWith(
        'QUIZ123',
        expect.objectContaining({
          status: QuizStatus.COMPLETED,
        }),
      );
    });
  });

  describe('getQuizStats', () => {
    it('should return comprehensive quiz statistics', async () => {
      const mockSession = {
        quizId: 'QUIZ123',
        title: 'Test Quiz',
        status: QuizStatus.IN_PROGRESS,
        questions: mockQuestions,
        currentQuestionIndex: 1,
        createdAt: new Date(),
        startTime: new Date(),
        maxParticipants: 100,
      };

      const mockLeaderboard = [
        {
          userId: 'user1',
          username: 'Alice',
          score: 150,
          rank: 1,
          correctAnswers: 5,
          totalAnswers: 5,
        },
      ];

      redisService.getQuizSession.mockResolvedValue(mockSession);
      redisService.getParticipantCount.mockResolvedValue(10);
      redisService.getFullLeaderboard.mockResolvedValue(mockLeaderboard);
      redisService.getAllAnswers.mockResolvedValue({
        q1: { correct: true },
        q2: { correct: true },
        q3: { correct: true },
        q4: { correct: true },
        q5: { correct: true },
      });

      const result = await service.getQuizStats('QUIZ123');

      expect(result).toMatchObject({
        quizId: 'QUIZ123',
        title: 'Test Quiz',
        status: QuizStatus.IN_PROGRESS,
        participantCount: 10,
        questionCount: 2,
        currentQuestion: 2,
      });
      expect(result.topPlayers).toBeDefined();
    });
  });

  describe('quizExists', () => {
    it('should return true if quiz exists', async () => {
      redisService.quizExists.mockResolvedValue(true);

      const result = await service.quizExists('QUIZ123');

      expect(result).toBe(true);
      expect(redisService.quizExists).toHaveBeenCalledWith('QUIZ123');
    });

    it('should return false if quiz does not exist', async () => {
      redisService.quizExists.mockResolvedValue(false);

      const result = await service.quizExists('NONEXISTENT');

      expect(result).toBe(false);
    });
  });
});
