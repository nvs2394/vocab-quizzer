/**
 * Redis Module for in-memory data storage
 *
 * AI Collaboration Note:
 * - Module structure pattern from NestJS documentation
 * - Redis connection setup assisted by Cursor AI
 */

import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
