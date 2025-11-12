/**
 * Main application entry point
 *
 * AI Collaboration Note:
 * - Basic NestJS bootstrap structure assisted by GitHub Copilot
 * - Configuration and CORS setup customized for WebSocket support
 * - Swagger/OpenAPI setup assisted by Cursor AI
 * - Verified: Tested WebSocket connection from client side
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Enable CORS for WebSocket connections
  app.enableCors({
    origin: process.env.WS_CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger/OpenAPI Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Real-Time Vocabulary Quiz API')
    .setDescription(
      'REST API documentation for the Real-Time Vocabulary Quiz system. ' +
        'This API provides endpoints for quiz management, leaderboards, and participants. ' +
        'Real-time features use WebSocket (Socket.IO) - see WebSocket documentation for event details.',
    )
    .setVersion('1.0')
    .addTag('health', 'Health check and system status endpoints')
    .addTag('quiz', 'Quiz management and session operations')
    .addTag('leaderboard', 'Leaderboard and scoring endpoints')
    .addTag('participants', 'Participant management endpoints')
    .addServer('http://localhost:3000', 'Local development server')
    .addServer('https://api.quiz.example.com', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document, {
    customSiteTitle: 'Quiz API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger API docs available at: http://localhost:${port}/swagger`);
  logger.log(`🔌 WebSocket server is ready on: ws://localhost:${port}`);
}

bootstrap();
