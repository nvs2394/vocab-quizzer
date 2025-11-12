/**
 * DTO for creating a quiz session
 */

import { IsString, IsNotEmpty, IsArray, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuizDto {
  @ApiProperty({
    description: 'Title of the quiz',
    example: 'English Vocabulary Challenge',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Number of questions to include in the quiz',
    example: 10,
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  questionCount?: number;

  @ApiPropertyOptional({
    description: 'Time allowed per question in seconds',
    example: 30,
    minimum: 5,
    maximum: 300,
  })
  @IsNumber()
  @Min(5)
  @Max(300)
  @IsOptional()
  timePerQuestion?: number; // seconds

  @ApiPropertyOptional({
    description: 'Specific question IDs to use (optional)',
    type: [String],
    example: ['q1', 'q2', 'q3'],
  })
  @IsArray()
  @IsOptional()
  questionIds?: string[];
}
