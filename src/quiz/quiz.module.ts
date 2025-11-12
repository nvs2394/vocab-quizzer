/**
 * Quiz Module - Encapsulates all quiz-related components
 *
 * AI Collaboration Note:
 * - Module structure follows NestJS best practices
 * - Provider and export configuration standard pattern
 */

import { Module } from '@nestjs/common';
import { QuizGateway } from './quiz.gateway';
import { QuizService } from './services/quiz.service';
import { QuestionService } from './services/question.service';
import { QuizController } from './quiz.controller';

@Module({
  controllers: [QuizController],
  providers: [QuizGateway, QuizService, QuestionService],
  exports: [QuizService, QuestionService],
})
export class QuizModule {}
