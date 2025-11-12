/**
 * WebSocket Exception Filter
 * Handles exceptions in WebSocket events and sends formatted error responses
 *
 * AI Collaboration Note:
 * - Exception filter pattern from NestJS documentation
 * - Error formatting assisted by GitHub Copilot
 */

import { Catch, ArgumentsHost, Logger, HttpException } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WebSocketExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WebSocketExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (exception instanceof WsException) {
      errorMessage = exception.message;
      statusCode = 400;
    } else if (exception instanceof HttpException) {
      errorMessage = exception.message;
      statusCode = exception.getStatus();
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    }

    this.logger.error(
      `WebSocket error: ${errorMessage}`,
      exception instanceof Error ? exception.stack : '',
    );

    client.emit('error', {
      statusCode,
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
