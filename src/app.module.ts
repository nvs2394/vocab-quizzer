/**
 * Root application module
 *
 * AI Collaboration Note:
 * - Module structure generated with NestJS CLI patterns
 * - ConfigModule setup assisted by AI suggestions
 * - Verified: All module imports working correctly
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QuizModule } from './quiz/quiz.module';
import { RedisModule } from './redis/redis.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    RedisModule,
    QuizModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
