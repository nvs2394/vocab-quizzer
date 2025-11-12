import { Test, TestingModule } from '@nestjs/testing';
import { QuizController } from './quiz.controller';
import { QuizService } from './services/quiz.service';
import { QuestionService } from './services/question.service';
import { QuizStatus } from './interfaces/quiz.interface';

describe('QuizController', () => {
  let controller: QuizController;
  let quizService: jest.Mocked<QuizService>;

  const mockQuizSession = {
    quizId: 'ABC123',
    title: 'Test Quiz',
    status: QuizStatus.WAITING,
    questions: [
      {
        id: 'q1',
        text: 'Question 1',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        difficulty: 'easy' as const,
        category: 'test',
        points: 10,
      },
    ],
    currentQuestionIndex: 0,
    createdAt: new Date(),
    maxParticipants: 100,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizController],
      providers: [
        {
          provide: QuizService,
          useValue: {
            createQuiz: jest.fn(),
            getQuizSession: jest.fn(),
            getParticipants: jest.fn(),
            getLeaderboard: jest.fn(),
          },
        },
        {
          provide: QuestionService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<QuizController>(QuizController);
    quizService = module.get(QuizService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createQuiz', () => {
    it('should create a new quiz and return quiz details', async () => {
      quizService.createQuiz.mockResolvedValue(mockQuizSession);

      const createQuizDto = {
        title: 'Test Quiz',
        questionCount: 10,
      };

      const result = await controller.createQuiz(createQuizDto);

      expect(quizService.createQuiz).toHaveBeenCalledWith('Test Quiz', 10);
      expect(result).toEqual({
        success: true,
        data: {
          quizId: 'ABC123',
          title: 'Test Quiz',
          status: QuizStatus.WAITING,
          questionCount: 1,
        },
      });
    });

    it('should use default question count if not provided', async () => {
      quizService.createQuiz.mockResolvedValue(mockQuizSession);

      const createQuizDto = {
        title: 'Test Quiz',
      };

      const result = await controller.createQuiz(createQuizDto);

      expect(quizService.createQuiz).toHaveBeenCalledWith('Test Quiz', 10);
      expect(result.success).toBe(true);
    });
  });

  describe('getQuiz', () => {
    it('should return quiz details with participants and leaderboard', async () => {
      const mockParticipants = [
        {
          userId: 'user1',
          username: 'Alice',
          socketId: 'socket1',
          score: 100,
          answersSubmitted: 5,
          joinedAt: new Date(),
        },
        {
          userId: 'user2',
          username: 'Bob',
          socketId: 'socket2',
          score: 80,
          answersSubmitted: 5,
          joinedAt: new Date(),
        },
      ];

      const mockLeaderboard = [
        {
          userId: 'user1',
          username: 'Alice',
          score: 100,
          rank: 1,
          correctAnswers: 5,
          totalAnswers: 5,
        },
        {
          userId: 'user2',
          username: 'Bob',
          score: 80,
          rank: 2,
          correctAnswers: 4,
          totalAnswers: 5,
        },
      ];

      quizService.getQuizSession.mockResolvedValue(mockQuizSession);
      quizService.getParticipants.mockResolvedValue(mockParticipants);
      quizService.getLeaderboard.mockResolvedValue(mockLeaderboard);

      const result = await controller.getQuiz('ABC123');

      expect(quizService.getQuizSession).toHaveBeenCalledWith('ABC123');
      expect(quizService.getParticipants).toHaveBeenCalledWith('ABC123');
      expect(quizService.getLeaderboard).toHaveBeenCalledWith('ABC123', 10);

      expect(result).toEqual({
        success: true,
        data: {
          quiz: {
            quizId: 'ABC123',
            title: 'Test Quiz',
            status: QuizStatus.WAITING,
            currentQuestion: 1,
            totalQuestions: 1,
            startTime: undefined,
            endTime: undefined,
          },
          participantCount: 2,
          leaderboard: mockLeaderboard,
        },
      });
    });
  });
});
