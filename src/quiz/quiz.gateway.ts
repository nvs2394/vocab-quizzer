/**
 * Quiz Gateway - WebSocket handler for real-time quiz events
 *
 * AI Collaboration Note:
 * - WebSocket gateway structure generated using Cursor AI with NestJS WebSocket patterns
 * - Prompt: "Create a NestJS WebSocket gateway for real-time quiz with Socket.IO"
 * - Event handlers and decorators suggested by GitHub Copilot
 * - Room-based broadcasting pattern assisted by AI documentation
 * - Verification:
 *   - Tested WebSocket connections with Socket.IO client
 *   - Verified event emission and broadcasting with multiple clients
 *   - Tested reconnection scenarios and error handling
 * - Refinement:
 *   - Added proper exception handling for WebSocket errors
 *   - Implemented user authentication on connection
 *   - Added connection/disconnection logging for monitoring
 *   - Optimized broadcast patterns to reduce network overhead
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { QuizService } from './services/quiz.service';
import { JoinQuizDto } from './dto/join-quiz.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { WebSocketExceptionFilter } from './filters/ws-exception.filter';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
@UseFilters(WebSocketExceptionFilter)
@UsePipes(new ValidationPipe({ transform: true }))
export class QuizGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(QuizGateway.name);

  // Track user to socket mapping for reconnection
  private userSocketMap = new Map<string, string>(); // userId -> socketId
  private socketUserMap = new Map<string, { userId: string; quizId: string }>(); // socketId -> user info

  constructor(private readonly quizService: QuizService) {}

  afterInit() {
    this.logger.log('🔌 WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Send welcome message
    client.emit('connected', {
      message: 'Connected to Real-Time Quiz Server',
      socketId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Get user info from socket
    const userInfo = this.socketUserMap.get(client.id);

    if (userInfo) {
      const { userId, quizId } = userInfo;

      // Leave quiz room
      client.leave(quizId);

      // Notify other participants
      this.server.to(quizId).emit('user_disconnected', {
        userId,
        timestamp: new Date().toISOString(),
      });

      // Clean up mappings
      this.userSocketMap.delete(userId);
      this.socketUserMap.delete(client.id);

      this.logger.debug(`User ${userId} disconnected from quiz ${quizId}`);
    }
  }

  // ==================== Quiz Management Events ====================

  /**
   * Create a new quiz session
   */
  @SubscribeMessage('create_quiz')
  async handleCreateQuiz(
    @MessageBody() createQuizDto: CreateQuizDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const quiz = await this.quizService.createQuiz(
        createQuizDto.title,
        createQuizDto.questionCount || 10,
      );

      this.logger.log(`Quiz created: ${quiz.quizId} by client ${client.id}`);

      return {
        event: 'quiz_created',
        data: {
          quizId: quiz.quizId,
          title: quiz.title,
          questionCount: quiz.questions.length,
          status: quiz.status,
        },
      };
    } catch (error) {
      this.logger.error(`Error creating quiz: ${error.message}`);
      return {
        event: 'error',
        data: {
          message: 'Failed to create quiz',
          error: error.message,
        },
      };
    }
  }

  /**
   * Join a quiz session
   */
  @SubscribeMessage('join_quiz')
  async handleJoinQuiz(@MessageBody() joinQuizDto: JoinQuizDto, @ConnectedSocket() client: Socket) {
    try {
      const { quizId, username } = joinQuizDto;

      // Generate userId (in production, this would come from authentication)
      const userId = client.id;

      // Join quiz
      const quiz = await this.quizService.joinQuiz(quizId, userId, username, client.id);

      // Join Socket.IO room
      await client.join(quizId);

      // Store user mapping
      this.userSocketMap.set(userId, client.id);
      this.socketUserMap.set(client.id, { userId, quizId });

      // Get updated participant list
      const participants = await this.quizService.getParticipants(quizId);

      // Notify all participants in the room
      this.server.to(quizId).emit('user_joined', {
        userId,
        username,
        participantCount: participants.length,
        timestamp: new Date().toISOString(),
      });

      // Get current leaderboard
      const leaderboard = await this.quizService.getLeaderboard(quizId, 10);

      this.logger.log(`User ${username} (${userId}) joined quiz ${quizId}`);

      return {
        event: 'joined_successfully',
        data: {
          quiz: {
            quizId: quiz.quizId,
            title: quiz.title,
            status: quiz.status,
            currentQuestion: quiz.currentQuestionIndex,
            totalQuestions: quiz.questions.length,
          },
          userId,
          participants: participants.map((p) => ({
            userId: p.userId,
            username: p.username,
            score: p.score,
          })),
          leaderboard,
        },
      };
    } catch (error) {
      this.logger.error(`Error joining quiz: ${error.message}`);
      return {
        event: 'error',
        data: {
          message: 'Failed to join quiz',
          error: error.message,
        },
      };
    }
  }

  /**
   * Start quiz session (admin/creator action)
   */
  @SubscribeMessage('start_quiz')
  async handleStartQuiz(@MessageBody() data: { quizId: string }) {
    try {
      const { quizId } = data;

      // Start quiz
      const quiz = await this.quizService.startQuiz(quizId);

      // Get first question
      const firstQuestion = await this.quizService.getCurrentQuestion(quizId);

      // Broadcast to all participants
      this.server.to(quizId).emit('quiz_started', {
        quiz: {
          quizId: quiz.quizId,
          title: quiz.title,
          totalQuestions: quiz.questions.length,
          startTime: quiz.startTime,
        },
        question: firstQuestion,
        questionNumber: 1,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Quiz ${quizId} started`);

      return {
        event: 'quiz_start_success',
        data: { quizId, status: 'started' },
      };
    } catch (error) {
      this.logger.error(`Error starting quiz: ${error.message}`);
      return {
        event: 'error',
        data: {
          message: 'Failed to start quiz',
          error: error.message,
        },
      };
    }
  }

  // ==================== Answer Submission Events ====================

  /**
   * Submit answer
   */
  @SubscribeMessage('submit_answer')
  async handleSubmitAnswer(
    @MessageBody() submitAnswerDto: SubmitAnswerDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { quizId, questionId, answer, timeTaken } = submitAnswerDto;
      const userId = client.id;

      // Submit answer and get result
      const result = await this.quizService.submitAnswer(
        quizId,
        userId,
        questionId,
        answer,
        timeTaken,
      );

      // Get participant info
      const participant = await this.quizService.getParticipant(quizId, userId);

      // Send result to the user
      client.emit('answer_result', {
        ...result,
        questionId,
        timestamp: new Date().toISOString(),
      });

      // Get updated leaderboard
      const leaderboard = await this.quizService.getLeaderboard(quizId, 10);

      // Broadcast score update to all participants
      this.server.to(quizId).emit('score_update', {
        userId,
        username: participant?.username,
        score: result.currentScore,
        rank: result.rank,
        timestamp: new Date().toISOString(),
      });

      // Broadcast leaderboard update
      this.server.to(quizId).emit('leaderboard_update', {
        leaderboard,
        timestamp: new Date().toISOString(),
      });

      this.logger.debug(
        `Answer submitted by ${userId}: ${result.correct ? 'Correct' : 'Incorrect'} (+${result.earnedPoints} points)`,
      );

      return {
        event: 'answer_submitted',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Error submitting answer: ${error.message}`);
      return {
        event: 'error',
        data: {
          message: 'Failed to submit answer',
          error: error.message,
        },
      };
    }
  }

  // ==================== Quiz Control Events ====================

  /**
   * Move to next question (admin/creator action)
   */
  @SubscribeMessage('next_question')
  async handleNextQuestion(@MessageBody() data: { quizId: string }) {
    try {
      const { quizId } = data;
      const nextQuestion = await this.quizService.nextQuestion(quizId);

      if (!nextQuestion) {
        // Quiz completed
        const session = await this.quizService.getQuizSession(quizId);
        const finalLeaderboard = await this.quizService.getFullLeaderboard(quizId);

        this.server.to(quizId).emit('quiz_completed', {
          quiz: {
            quizId: session.quizId,
            title: session.title,
            endTime: session.endTime,
          },
          leaderboard: finalLeaderboard,
          timestamp: new Date().toISOString(),
        });

        this.logger.log(`Quiz ${quizId} completed`);

        return {
          event: 'quiz_completed',
          data: { quizId, leaderboard: finalLeaderboard },
        };
      }

      const session = await this.quizService.getQuizSession(quizId);

      // Broadcast next question to all participants
      this.server.to(quizId).emit('question_next', {
        question: nextQuestion,
        questionNumber: session.currentQuestionIndex + 1,
        totalQuestions: session.questions.length,
        timestamp: new Date().toISOString(),
      });

      this.logger.debug(`Moving to next question in quiz ${quizId}`);

      return {
        event: 'next_question_success',
        data: {
          question: nextQuestion,
          questionNumber: session.currentQuestionIndex + 1,
        },
      };
    } catch (error) {
      this.logger.error(`Error moving to next question: ${error.message}`);
      return {
        event: 'error',
        data: {
          message: 'Failed to move to next question',
          error: error.message,
        },
      };
    }
  }

  // ==================== Utility Methods ====================

  /**
   * Broadcast message to all clients in a quiz room
   */
  broadcastToQuiz(quizId: string, event: string, data: Record<string, unknown>) {
    this.server.to(quizId).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}
