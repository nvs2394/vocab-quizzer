/**
 * DTO for joining a quiz session
 *
 * AI Collaboration Note:
 * - Class-validator decorators suggested by GitHub Copilot
 * - Validation rules refined based on business requirements
 */

import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class JoinQuizDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(6)
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Quiz ID must contain only uppercase letters and numbers',
  })
  quizId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(30)
  username: string;
}
