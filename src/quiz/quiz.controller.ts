/**
 * Quiz Controller - HTTP REST endpoints for quiz management
 * Provides alternative HTTP access to quiz functionality
 *
 * AI Collaboration Note:
 * - REST endpoints generated with Cursor AI assistance
 * - Swagger/OpenAPI decorators added for API documentation
 * - Standard CRUD patterns for quiz management
 */

import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { QuizService } from './services/quiz.service';
import { QuestionService } from './services/question.service';
import { CreateQuizDto } from './dto/create-quiz.dto';

@ApiTags('quiz')
@Controller('quiz')
export class QuizController {
  private readonly logger = new Logger(QuizController.name);

  constructor(
    private readonly quizService: QuizService,
    private readonly questionService: QuestionService,
  ) {}

  /**
   * Create a new quiz session
   */
  @Post('create')
  @ApiOperation({
    summary: 'Create a new quiz session',
    description:
      'Creates a new quiz with specified title and number of questions. Returns a unique quiz ID that participants can use to join.',
  })
  @ApiBody({ type: CreateQuizDto })
  @ApiResponse({
    status: 201,
    description: 'Quiz created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            quizId: { type: 'string', example: 'ABC123' },
            title: { type: 'string', example: 'English Vocabulary Challenge' },
            status: { type: 'string', example: 'waiting' },
            questionCount: { type: 'number', example: 10 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createQuiz(@Body() createQuizDto: CreateQuizDto) {
    this.logger.log('Creating new quiz via HTTP');
    const quiz = await this.quizService.createQuiz(
      createQuizDto.title,
      createQuizDto.questionCount || 10,
    );

    return {
      success: true,
      data: {
        quizId: quiz.quizId,
        title: quiz.title,
        status: quiz.status,
        questionCount: quiz.questions.length,
      },
    };
  }

  /**
   * Get quiz session details
   */
  @Get(':quizId')
  @ApiOperation({
    summary: 'Get quiz session details',
    description:
      'Retrieves complete information about a quiz session including status, participants, and leaderboard.',
  })
  @ApiParam({
    name: 'quizId',
    description: 'Quiz ID (6-character alphanumeric)',
    example: 'ABC123',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            quiz: {
              type: 'object',
              properties: {
                quizId: { type: 'string', example: 'ABC123' },
                title: { type: 'string', example: 'English Vocabulary Challenge' },
                status: { type: 'string', example: 'in_progress' },
                currentQuestion: { type: 'number', example: 5 },
                totalQuestions: { type: 'number', example: 10 },
                startTime: { type: 'string', example: '2025-11-10T10:00:00.000Z' },
                endTime: { type: 'string', nullable: true },
              },
            },
            participantCount: { type: 'number', example: 15 },
            leaderboard: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  username: { type: 'string' },
                  score: { type: 'number' },
                  rank: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async getQuiz(@Param('quizId') quizId: string) {
    const quiz = await this.quizService.getQuizSession(quizId);
    const participants = await this.quizService.getParticipants(quizId);
    const leaderboard = await this.quizService.getLeaderboard(quizId, 10);

    return {
      success: true,
      data: {
        quiz: {
          quizId: quiz.quizId,
          title: quiz.title,
          status: quiz.status,
          currentQuestion: quiz.currentQuestionIndex + 1,
          totalQuestions: quiz.questions.length,
          startTime: quiz.startTime,
          endTime: quiz.endTime,
        },
        participantCount: participants.length,
        leaderboard,
      },
    };
  }
}
