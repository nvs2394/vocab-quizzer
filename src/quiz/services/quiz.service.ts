/**
 * Quiz Service - Core business logic for quiz management
 *
 * AI Collaboration Note:
 * - Service structure and method signatures generated with Cursor AI assistance
 * - Prompt: "Create a quiz service with methods for session management, scoring, and leaderboard"
 * - Score calculation logic refined with AI suggestions for time-based bonuses
 * - Leaderboard generation optimized based on Redis sorted set operations
 * - Verification: Unit tests written to validate scoring logic and session management
 * - Tested edge cases: duplicate answers, invalid quiz IDs, concurrent score updates
 * - Refinement: Added idempotency for answer submission to prevent double scoring
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { QuestionService } from './question.service';
import {
  QuizSession,
  QuizStatus,
  Participant,
  LeaderboardEntry,
  AnswerResult,
  Question,
} from '../interfaces/quiz.interface';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);
  private readonly quizSessionTTL: number;
  private readonly maxParticipants: number;
  private readonly scorePerCorrect: number;
  private readonly timeBonusEnabled: boolean;

  constructor(
    private readonly redisService: RedisService,
    private readonly questionService: QuestionService,
    private readonly configService: ConfigService,
  ) {
    this.quizSessionTTL = this.configService.get<number>('QUIZ_SESSION_TTL', 3600);
    this.maxParticipants = this.configService.get<number>('MAX_PARTICIPANTS_PER_QUIZ', 100);
    this.scorePerCorrect = this.configService.get<number>('SCORE_PER_CORRECT_ANSWER', 10);
    this.timeBonusEnabled = this.configService.get<boolean>('TIME_BONUS_ENABLED', true);
  }

  /**
   * Create a new quiz session
   */
  async createQuiz(title: string, questionCount: number = 10): Promise<QuizSession> {
    const quizId = this.generateQuizId();
    const questions = this.questionService.getBalancedQuestions(questionCount);

    const quizSession: QuizSession = {
      quizId,
      title,
      status: QuizStatus.WAITING,
      questions,
      currentQuestionIndex: 0,
      createdAt: new Date(),
      maxParticipants: this.maxParticipants,
    };

    await this.redisService.createQuizSession(quizId, quizSession, this.quizSessionTTL);
    this.logger.log(`Created quiz session: ${quizId} - ${title}`);

    return quizSession;
  }

  /**
   * Get quiz session
   */
  async getQuizSession(quizId: string): Promise<QuizSession> {
    const session = await this.redisService.getQuizSession(quizId);
    if (!session) {
      throw new NotFoundException(`Quiz session ${quizId} not found`);
    }
    return session;
  }

  /**
   * Join a quiz session
   */
  async joinQuiz(
    quizId: string,
    userId: string,
    username: string,
    socketId: string,
  ): Promise<QuizSession> {
    // Check if quiz exists
    const session = await this.getQuizSession(quizId);

    // Check if quiz is still accepting participants
    if (session.status === QuizStatus.COMPLETED) {
      throw new BadRequestException('Quiz has already completed');
    }

    // Check participant limit
    const participantCount = await this.redisService.getParticipantCount(quizId);
    if (participantCount >= this.maxParticipants) {
      throw new BadRequestException('Quiz is full');
    }

    // Check if user already joined
    const existingParticipant = await this.redisService.getParticipant(quizId, userId);
    if (existingParticipant) {
      // Update socket ID for reconnection
      existingParticipant.socketId = socketId;
      await this.redisService.addParticipant(quizId, userId, existingParticipant);
      this.logger.log(`User ${username} reconnected to quiz ${quizId}`);
      return session;
    }

    // Add participant
    const participant: Participant = {
      userId,
      username,
      socketId,
      joinedAt: new Date(),
      score: 0,
      answersSubmitted: 0,
    };

    await this.redisService.addParticipant(quizId, userId, participant);

    // Initialize score to 0
    await this.redisService.updateScore(quizId, userId, 0);

    this.logger.log(`User ${username} joined quiz ${quizId}`);
    return session;
  }

  /**
   * Start quiz session
   */
  async startQuiz(quizId: string): Promise<QuizSession> {
    const session = await this.getQuizSession(quizId);

    if (session.status !== QuizStatus.WAITING) {
      throw new BadRequestException('Quiz has already started or completed');
    }

    const participantCount = await this.redisService.getParticipantCount(quizId);
    if (participantCount === 0) {
      throw new BadRequestException('Cannot start quiz with no participants');
    }

    session.status = QuizStatus.IN_PROGRESS;
    session.startTime = new Date();
    session.currentQuestionIndex = 0;

    await this.redisService.updateQuizSession(quizId, session);
    await this.redisService.setCurrentQuestion(quizId, 0);

    this.logger.log(`Started quiz ${quizId} with ${participantCount} participants`);
    return session;
  }

  /**
   * Get current question for quiz
   */
  async getCurrentQuestion(quizId: string): Promise<Question> {
    const session = await this.getQuizSession(quizId);
    const currentIndex = await this.redisService.getCurrentQuestion(quizId);

    if (currentIndex >= session.questions.length) {
      throw new BadRequestException('No more questions available');
    }

    const question = session.questions[currentIndex];

    // Return question without correct answer (security)
    return {
      ...question,
      correctAnswer: '', // Hide correct answer from clients
    };
  }

  /**
   * Move to next question
   */
  async nextQuestion(quizId: string): Promise<Question | null> {
    const session = await this.getQuizSession(quizId);
    const currentIndex = await this.redisService.getCurrentQuestion(quizId);
    const nextIndex = currentIndex + 1;

    if (nextIndex >= session.questions.length) {
      // Quiz completed
      await this.completeQuiz(quizId);
      return null;
    }

    session.currentQuestionIndex = nextIndex;
    await this.redisService.setCurrentQuestion(quizId, nextIndex);
    await this.redisService.updateQuizSession(quizId, session);

    return this.getCurrentQuestion(quizId);
  }

  /**
   * Submit answer and calculate score
   */
  async submitAnswer(
    quizId: string,
    userId: string,
    questionId: string,
    answer: string,
    timeTaken: number,
  ): Promise<AnswerResult> {
    const session = await this.getQuizSession(quizId);

    if (session.status !== QuizStatus.IN_PROGRESS) {
      throw new BadRequestException('Quiz is not in progress');
    }

    // Check if answer already submitted (idempotency)
    const existingAnswer = await this.redisService.getAnswer(quizId, userId, questionId);
    if (existingAnswer) {
      this.logger.warn(
        `User ${userId} attempted to submit duplicate answer for question ${questionId}`,
      );

      // Return cached result
      return {
        correct: existingAnswer.correct,
        correctAnswer: existingAnswer.correctAnswer,
        earnedPoints: existingAnswer.earnedPoints,
        currentScore: await this.redisService.getScore(quizId, userId),
        rank: (await this.redisService.getRank(quizId, userId)) || 0,
      };
    }

    // Validate answer
    const isCorrect = this.questionService.validateAnswer(questionId, answer);
    const question = this.questionService.getQuestionById(questionId);

    if (!question) {
      throw new NotFoundException(`Question ${questionId} not found`);
    }

    // Calculate points
    const earnedPoints = this.timeBonusEnabled
      ? this.questionService.calculatePoints(questionId, isCorrect, timeTaken, 30)
      : isCorrect
        ? question.points
        : 0;

    // Update score atomically
    const newScore =
      earnedPoints > 0
        ? await this.redisService.incrementScore(quizId, userId, earnedPoints)
        : await this.redisService.getScore(quizId, userId);

    // Store answer
    await this.redisService.storeAnswer(quizId, userId, questionId, {
      answer,
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      earnedPoints,
      timeTaken,
      submittedAt: new Date(),
    });

    // Update participant stats
    const participant = await this.redisService.getParticipant(quizId, userId);
    if (participant) {
      participant.answersSubmitted += 1;
      participant.score = newScore;
      await this.redisService.addParticipant(quizId, userId, participant);
    }

    // Get current rank
    const rank = (await this.redisService.getRank(quizId, userId)) || 0;

    this.logger.debug(
      `User ${userId} answered question ${questionId}: ${isCorrect ? 'Correct' : 'Incorrect'} (+${earnedPoints} points)`,
    );

    return {
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      earnedPoints,
      currentScore: newScore,
      rank: rank + 1, // Convert to 1-based ranking
    };
  }

  /**
   * Get leaderboard for a quiz
   */
  async getLeaderboard(quizId: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    await this.getQuizSession(quizId); // Verify quiz exists

    const leaderboard = await this.redisService.getFullLeaderboard(quizId);

    // Calculate additional stats
    const enrichedLeaderboard = await Promise.all(
      leaderboard.slice(0, limit).map(async (entry) => {
        const answers = await this.redisService.getAllAnswers(quizId, entry.userId);
        const correctAnswers = Object.values(answers).filter((a: any) => a.correct).length;
        const totalAnswers = Object.keys(answers).length;

        return {
          ...entry,
          correctAnswers,
          totalAnswers,
        };
      }),
    );

    return enrichedLeaderboard;
  }

  /**
   * Get full leaderboard (all participants)
   */
  async getFullLeaderboard(quizId: string): Promise<LeaderboardEntry[]> {
    await this.getQuizSession(quizId);
    return await this.redisService.getFullLeaderboard(quizId);
  }

  /**
   * Get participant details
   */
  async getParticipant(quizId: string, userId: string): Promise<Participant | null> {
    return await this.redisService.getParticipant(quizId, userId);
  }

  /**
   * Get all participants
   */
  async getParticipants(quizId: string): Promise<Participant[]> {
    const userIds = await this.redisService.getParticipants(quizId);

    const participants = await Promise.all(
      userIds.map(async (userId) => {
        return await this.redisService.getParticipant(quizId, userId);
      }),
    );

    return participants.filter((p) => p !== null) as Participant[];
  }

  /**
   * Remove participant (disconnect)
   */
  async removeParticipant(quizId: string, userId: string): Promise<void> {
    await this.redisService.removeParticipant(quizId, userId);
    this.logger.log(`Removed participant ${userId} from quiz ${quizId}`);
  }

  /**
   * Complete quiz session
   */
  async completeQuiz(quizId: string): Promise<QuizSession> {
    const session = await this.getQuizSession(quizId);

    session.status = QuizStatus.COMPLETED;
    session.endTime = new Date();

    await this.redisService.updateQuizSession(quizId, session);
    this.logger.log(`Completed quiz ${quizId}`);

    return session;
  }

  /**
   * Get quiz statistics
   */
  async getQuizStats(quizId: string) {
    const session = await this.getQuizSession(quizId);
    const participantCount = await this.redisService.getParticipantCount(quizId);
    const leaderboard = await this.getLeaderboard(quizId, 3);

    return {
      quizId: session.quizId,
      title: session.title,
      status: session.status,
      participantCount,
      questionCount: session.questions.length,
      currentQuestion: session.currentQuestionIndex + 1,
      topPlayers: leaderboard,
      startTime: session.startTime,
      endTime: session.endTime,
    };
  }

  /**
   * Generate unique quiz ID
   */
  private generateQuizId(): string {
    // Generate a 6-character alphanumeric code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let quizId = '';
    for (let i = 0; i < 6; i++) {
      quizId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return quizId;
  }

  /**
   * Check if quiz exists
   */
  async quizExists(quizId: string): Promise<boolean> {
    return await this.redisService.quizExists(quizId);
  }
}
