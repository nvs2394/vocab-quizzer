import { Test, TestingModule } from '@nestjs/testing';
import { QuizGateway } from './quiz.gateway';
import { QuizService } from './services/quiz.service';
import { Server, Socket } from 'socket.io';
import { QuizStatus } from './interfaces/quiz.interface';

describe('QuizGateway', () => {
  let gateway: QuizGateway;
  let quizService: jest.Mocked<QuizService>;
  let mockServer: jest.Mocked<Server>;
  let mockClient: jest.Mocked<Socket>;

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
      providers: [
        QuizGateway,
        {
          provide: QuizService,
          useValue: {
            createQuiz: jest.fn(),
            joinQuiz: jest.fn(),
            startQuiz: jest.fn(),
            getCurrentQuestion: jest.fn(),
            submitAnswer: jest.fn(),
            getLeaderboard: jest.fn(),
            nextQuestion: jest.fn(),
            getQuizSession: jest.fn(),
            getFullLeaderboard: jest.fn(),
            removeParticipant: jest.fn(),
            getParticipants: jest.fn(),
            getParticipant: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<QuizGateway>(QuizGateway);
    quizService = module.get(QuizService);

    // Mock Server
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    // Mock Socket
    mockClient = {
      id: 'socket123',
      join: jest.fn(),
      emit: jest.fn(),
      data: {},
    } as any;

    gateway.server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('afterInit', () => {
    it('should log initialization message', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');

      gateway.afterInit();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('WebSocket Gateway initialized'));
    });
  });

  describe('handleConnection', () => {
    it('should handle new client connection', async () => {
      await gateway.handleConnection(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith(
        'connected',
        expect.objectContaining({
          message: 'Connected to Real-Time Quiz Server',
          socketId: 'socket123',
        }),
      );
    });
  });

  describe('handleDisconnect', () => {
    it('should handle client disconnection', async () => {
      await gateway.handleDisconnect(mockClient);

      expect(mockClient.id).toBe('socket123');
    });
  });

  describe('handleCreateQuiz', () => {
    it('should create a new quiz', async () => {
      quizService.createQuiz.mockResolvedValue(mockQuizSession);

      const createQuizDto = {
        title: 'Test Quiz',
        questionCount: 10,
      };

      const result = await gateway.handleCreateQuiz(createQuizDto, mockClient);

      expect(quizService.createQuiz).toHaveBeenCalledWith('Test Quiz', 10);
      expect(result.event).toBe('quiz_created');
      expect(result.data.quizId).toBe('ABC123');
    });
  });

  describe('handleJoinQuiz', () => {
    it('should allow user to join quiz', async () => {
      const joinQuizDto = {
        quizId: 'ABC123',
        userId: 'user1',
        username: 'Alice',
      };

      const mockParticipants = [
        {
          userId: 'user1',
          username: 'Alice',
          socketId: 'socket123',
          score: 0,
          answersSubmitted: 0,
          joinedAt: new Date(),
        },
      ];

      quizService.joinQuiz.mockResolvedValue(mockQuizSession);
      quizService.getParticipants.mockResolvedValue(mockParticipants);
      quizService.getLeaderboard.mockResolvedValue([]);

      const result = await gateway.handleJoinQuiz(joinQuizDto, mockClient);

      expect(quizService.joinQuiz).toHaveBeenCalledWith(
        'ABC123',
        'socket123',
        'Alice',
        'socket123',
      );
      expect(mockClient.join).toHaveBeenCalledWith('ABC123');
      expect(mockServer.to).toHaveBeenCalledWith('ABC123');
      expect(result.event).toBe('joined_successfully');
    });

    it('should handle join errors', async () => {
      const joinQuizDto = {
        quizId: 'ABC123',
        userId: 'user1',
        username: 'Alice',
      };

      quizService.joinQuiz.mockRejectedValue(new Error('Quiz not found'));

      const result = await gateway.handleJoinQuiz(joinQuizDto, mockClient);

      expect(result.event).toBe('error');
      expect(result.data.message).toContain('Failed to join quiz');
    });
  });

  describe('handleStartQuiz', () => {
    it('should start quiz and broadcast to participants', async () => {
      const startedSession = {
        ...mockQuizSession,
        status: QuizStatus.IN_PROGRESS,
        startTime: new Date(),
      };

      const mockQuestion = {
        id: 'q1',
        text: 'Question 1',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: '',
        difficulty: 'easy' as const,
        category: 'test',
        points: 10,
      };

      quizService.startQuiz.mockResolvedValue(startedSession);
      quizService.getCurrentQuestion.mockResolvedValue(mockQuestion);

      const result = await gateway.handleStartQuiz({ quizId: 'ABC123' });

      expect(quizService.startQuiz).toHaveBeenCalledWith('ABC123');
      expect(mockServer.to).toHaveBeenCalledWith('ABC123');
      expect(result.event).toBe('quiz_start_success');
    });
  });

  describe('handleSubmitAnswer', () => {
    it('should process answer submission', async () => {
      const submitAnswerDto = {
        quizId: 'ABC123',
        userId: 'user1',
        questionId: 'q1',
        answer: 'A',
        timeTaken: 10,
      };

      const mockAnswerResult = {
        correct: true,
        correctAnswer: 'A',
        earnedPoints: 15,
        currentScore: 15,
        rank: 1,
      };

      const mockLeaderboard = [{ userId: 'user1', username: 'Alice', score: 15, rank: 1 }];
      const mockParticipant = {
        userId: 'socket123',
        username: 'Alice',
        socketId: 'socket123',
        score: 15,
        answersSubmitted: 1,
        joinedAt: new Date(),
      };

      quizService.submitAnswer.mockResolvedValue(mockAnswerResult);
      quizService.getParticipant.mockResolvedValue(mockParticipant);
      quizService.getLeaderboard.mockResolvedValue(mockLeaderboard);

      const result = await gateway.handleSubmitAnswer(submitAnswerDto, mockClient);

      expect(quizService.submitAnswer).toHaveBeenCalledWith('ABC123', 'socket123', 'q1', 'A', 10);
      expect(result.event).toBe('answer_submitted');
      if ('correct' in result.data) {
        expect(result.data.correct).toBe(true);
        expect(result.data.earnedPoints).toBe(15);
      }
    });

    it('should handle submission errors', async () => {
      const submitAnswerDto = {
        quizId: 'ABC123',
        userId: 'user1',
        questionId: 'q1',
        answer: 'A',
        timeTaken: 10,
      };

      quizService.submitAnswer.mockRejectedValue(new Error('Quiz not in progress'));

      const result = await gateway.handleSubmitAnswer(submitAnswerDto, mockClient);

      expect(result.event).toBe('error');
      if ('message' in result.data) {
        expect(result.data.message).toContain('Failed to submit answer');
      }
    });
  });

  describe('handleNextQuestion', () => {
    it('should move to next question', async () => {
      const mockNextQuestion = {
        id: 'q2',
        text: 'Question 2',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: '',
        difficulty: 'medium' as const,
        category: 'test',
        points: 15,
      };

      quizService.nextQuestion.mockResolvedValue(mockNextQuestion);
      quizService.getQuizSession.mockResolvedValue(mockQuizSession);

      const result = await gateway.handleNextQuestion({ quizId: 'ABC123' });

      expect(quizService.nextQuestion).toHaveBeenCalledWith('ABC123');
      expect(mockServer.to).toHaveBeenCalledWith('ABC123');
      expect(result.event).toBe('next_question_success');
    });

    it('should handle quiz completion', async () => {
      const mockSession = {
        ...mockQuizSession,
        status: QuizStatus.COMPLETED,
        endTime: new Date(),
      };

      const mockLeaderboard = [{ userId: 'user1', username: 'Alice', score: 150, rank: 1 }];

      quizService.nextQuestion.mockResolvedValue(null);
      quizService.getQuizSession.mockResolvedValue(mockSession);
      quizService.getFullLeaderboard.mockResolvedValue(mockLeaderboard);

      const result = await gateway.handleNextQuestion({ quizId: 'ABC123' });

      expect(mockServer.to).toHaveBeenCalledWith('ABC123');
      expect(result.event).toBe('quiz_completed');
      expect(result.data.leaderboard).toEqual(mockLeaderboard);
    });
  });

  describe('broadcastToQuiz', () => {
    it('should broadcast message to quiz room', () => {
      const data = { message: 'Test broadcast' };

      gateway.broadcastToQuiz('ABC123', 'test_event', data);

      expect(mockServer.to).toHaveBeenCalledWith('ABC123');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'test_event',
        expect.objectContaining({
          message: 'Test broadcast',
          timestamp: expect.any(String),
        }),
      );
    });
  });
});
