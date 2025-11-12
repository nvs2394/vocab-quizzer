/**
 * DTO for submitting an answer
 *
 * AI Collaboration Note:
 * - Structure generated with Cursor AI assistance
 * - Validation rules customized for quiz requirements
 */

import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  quizId: string;

  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsNotEmpty()
  answer: string;

  @IsNumber()
  @Min(0)
  timeTaken: number; // Time taken to answer in seconds
}
