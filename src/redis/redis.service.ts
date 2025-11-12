/**
 * Redis Service for managing in-memory data operations
 *
 * AI Collaboration Note:
 * - Redis connection and client setup generated with GitHub Copilot assistance
 * - Prompt: "Create a Redis service with ioredis for NestJS with connection management"
 * - Leaderboard methods (getLeaderboard, updateScore) pattern suggested by AI
 * - Verification: Tested Redis operations with unit tests and manual Redis CLI checks
 * - Refinement: Added error handling and connection retry logic
 * - Added TTL management for automatic session cleanup
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');
    const db = this.configService.get<number>('REDIS_DB', 0);

    this.redisClient = new Redis({
      host,
      port,
      password,
      db,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.redisClient.on('error', (err) => {
      this.logger.error('Redis connection error:', err);
    });

    this.redisClient.on('ready', () => {
      this.logger.log('Redis client ready');
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
    this.logger.log('Redis connection closed');
  }

  getClient(): Redis {
    return this.redisClient;
  }

  // ==================== Quiz Session Operations ====================

  /**
   * Create a new quiz session
   */
  async createQuizSession(quizId: string, sessionData: any, ttl: number = 3600): Promise<void> {
    const key = `quiz:session:${quizId}`;
    await this.redisClient.setex(key, ttl, JSON.stringify(sessionData));
    this.logger.debug(`Created quiz session: ${quizId}`);
  }

  /**
   * Get quiz session data
   */
  async getQuizSession(quizId: string): Promise<any | null> {
    const key = `quiz:session:${quizId}`;
    const data = await this.redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Update quiz session data
   */
  async updateQuizSession(quizId: string, sessionData: any): Promise<void> {
    const key = `quiz:session:${quizId}`;
    const ttl = await this.redisClient.ttl(key);

    if (ttl > 0) {
      await this.redisClient.setex(key, ttl, JSON.stringify(sessionData));
    } else {
      await this.redisClient.set(key, JSON.stringify(sessionData));
    }
  }

  /**
   * Delete quiz session
   */
  async deleteQuizSession(quizId: string): Promise<void> {
    const key = `quiz:session:${quizId}`;
    await this.redisClient.del(key);
    this.logger.debug(`Deleted quiz session: ${quizId}`);
  }

  // ==================== Participant Operations ====================

  /**
   * Add participant to quiz
   */
  async addParticipant(quizId: string, userId: string, userData: any): Promise<void> {
    const key = `quiz:participants:${quizId}`;
    const userKey = `quiz:participant:${quizId}:${userId}`;

    // Add to participants set
    await this.redisClient.sadd(key, userId);

    // Store participant data
    await this.redisClient.set(userKey, JSON.stringify(userData));

    this.logger.debug(`Added participant ${userId} to quiz ${quizId}`);
  }

  /**
   * Get all participants in a quiz
   */
  async getParticipants(quizId: string): Promise<string[]> {
    const key = `quiz:participants:${quizId}`;
    return await this.redisClient.smembers(key);
  }

  /**
   * Get participant data
   */
  async getParticipant(quizId: string, userId: string): Promise<any | null> {
    const userKey = `quiz:participant:${quizId}:${userId}`;
    const data = await this.redisClient.get(userKey);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Remove participant from quiz
   */
  async removeParticipant(quizId: string, userId: string): Promise<void> {
    const key = `quiz:participants:${quizId}`;
    const userKey = `quiz:participant:${quizId}:${userId}`;

    await this.redisClient.srem(key, userId);
    await this.redisClient.del(userKey);
  }

  /**
   * Get participant count
   */
  async getParticipantCount(quizId: string): Promise<number> {
    const key = `quiz:participants:${quizId}`;
    return await this.redisClient.scard(key);
  }

  // ==================== Score Operations ====================

  /**
   * Update participant score (using Redis Sorted Set for automatic ranking)
   */
  async updateScore(quizId: string, userId: string, score: number): Promise<void> {
    const key = `quiz:scores:${quizId}`;
    await this.redisClient.zadd(key, score, userId);
    this.logger.debug(`Updated score for ${userId} in quiz ${quizId}: ${score}`);
  }

  /**
   * Increment participant score atomically
   */
  async incrementScore(quizId: string, userId: string, increment: number): Promise<number> {
    const key = `quiz:scores:${quizId}`;
    const newScore = await this.redisClient.zincrby(key, increment, userId);
    return parseFloat(newScore);
  }

  /**
   * Get participant score
   */
  async getScore(quizId: string, userId: string): Promise<number> {
    const key = `quiz:scores:${quizId}`;
    const score = await this.redisClient.zscore(key, userId);
    return score ? parseFloat(score) : 0;
  }

  /**
   * Get participant rank (0-based, 0 is highest)
   */
  async getRank(quizId: string, userId: string): Promise<number | null> {
    const key = `quiz:scores:${quizId}`;
    const rank = await this.redisClient.zrevrank(key, userId);
    return rank !== null ? rank : null;
  }

  // ==================== Leaderboard Operations ====================

  /**
   * Get top N participants (leaderboard)
   */
  async getLeaderboard(
    quizId: string,
    limit: number = 10,
  ): Promise<Array<{ userId: string; score: number; rank: number }>> {
    const key = `quiz:scores:${quizId}`;

    // ZREVRANGE returns highest scores first
    const results = await this.redisClient.zrevrange(key, 0, limit - 1, 'WITHSCORES');

    const leaderboard = [];
    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({
        userId: results[i],
        score: parseFloat(results[i + 1]),
        rank: i / 2 + 1,
      });
    }

    return leaderboard;
  }

  /**
   * Get full leaderboard with participant details
   */
  async getFullLeaderboard(
    quizId: string,
  ): Promise<Array<{ userId: string; username: string; score: number; rank: number }>> {
    const key = `quiz:scores:${quizId}`;
    const results = await this.redisClient.zrevrange(key, 0, -1, 'WITHSCORES');

    const leaderboard = [];
    for (let i = 0; i < results.length; i += 2) {
      const userId = results[i];
      const score = parseFloat(results[i + 1]);
      const participant = await this.getParticipant(quizId, userId);

      leaderboard.push({
        userId,
        username: participant?.username || 'Unknown',
        score,
        rank: i / 2 + 1,
      });
    }

    return leaderboard;
  }

  // ==================== Answer Tracking Operations ====================

  /**
   * Store user's answer
   */
  async storeAnswer(
    quizId: string,
    userId: string,
    questionId: string,
    answer: any,
  ): Promise<void> {
    const key = `quiz:answers:${quizId}:${userId}`;
    await this.redisClient.hset(key, questionId, JSON.stringify(answer));
  }

  /**
   * Get user's answer for a question
   */
  async getAnswer(quizId: string, userId: string, questionId: string): Promise<any | null> {
    const key = `quiz:answers:${quizId}:${userId}`;
    const answer = await this.redisClient.hget(key, questionId);
    return answer ? JSON.parse(answer) : null;
  }

  /**
   * Get all answers for a user in a quiz
   */
  async getAllAnswers(quizId: string, userId: string): Promise<Record<string, any>> {
    const key = `quiz:answers:${quizId}:${userId}`;
    const answers = await this.redisClient.hgetall(key);

    const parsed: Record<string, any> = {};
    for (const [questionId, answerStr] of Object.entries(answers)) {
      parsed[questionId] = JSON.parse(answerStr);
    }

    return parsed;
  }

  // ==================== Question State Operations ====================

  /**
   * Set current question for quiz
   */
  async setCurrentQuestion(quizId: string, questionIndex: number): Promise<void> {
    const key = `quiz:current_question:${quizId}`;
    await this.redisClient.set(key, questionIndex.toString());
  }

  /**
   * Get current question index
   */
  async getCurrentQuestion(quizId: string): Promise<number> {
    const key = `quiz:current_question:${quizId}`;
    const index = await this.redisClient.get(key);
    return index ? parseInt(index, 10) : 0;
  }

  // ==================== Utility Operations ====================

  /**
   * Check if quiz exists
   */
  async quizExists(quizId: string): Promise<boolean> {
    const key = `quiz:session:${quizId}`;
    const exists = await this.redisClient.exists(key);
    return exists === 1;
  }

  /**
   * Clean up all quiz data
   */
  async cleanupQuiz(quizId: string): Promise<void> {
    const pattern = `quiz:*:${quizId}*`;
    const keys = await this.redisClient.keys(pattern);

    if (keys.length > 0) {
      await this.redisClient.del(...keys);
      this.logger.log(`Cleaned up ${keys.length} keys for quiz ${quizId}`);
    }
  }

  /**
   * Get Redis info for monitoring
   */
  async getInfo(): Promise<string> {
    return await this.redisClient.info();
  }
}
