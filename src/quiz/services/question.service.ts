/**
 * Question Service - Manages question bank and question selection
 *
 * AI Collaboration Note:
 * - Question structure and service methods assisted by GitHub Copilot
 * - Verification: Reviewed all questions for accuracy and difficulty levels
 * - Refinement: Adjusted difficulty distribution and added more diverse vocabulary
 */

import { Injectable, Logger } from '@nestjs/common';
import { Question } from '../interfaces/quiz.interface';
import { QUESTION_BANK } from '../data/question-bank.data';

@Injectable()
export class QuestionService {
  private readonly logger = new Logger(QuestionService.name);

  // Question bank imported from data file
  // In production, this would come from a database
  private readonly questionBank: Question[] = QUESTION_BANK;

  /**
   * Get all questions
   */
  getAllQuestions(): Question[] {
    return [...this.questionBank];
  }

  /**
   * Get questions by difficulty
   */
  getQuestionsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Question[] {
    return this.questionBank.filter((q) => q.difficulty === difficulty);
  }

  /**
   * Get a random selection of questions
   */
  getRandomQuestions(count: number): Question[] {
    const shuffled = [...this.questionBank].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Get a balanced mix of questions by difficulty
   */
  getBalancedQuestions(count: number): Question[] {
    const easy = this.getQuestionsByDifficulty('easy');
    const medium = this.getQuestionsByDifficulty('medium');
    const hard = this.getQuestionsByDifficulty('hard');

    // Distribution: 40% easy, 40% medium, 20% hard
    const easyCount = Math.ceil(count * 0.4);
    const mediumCount = Math.ceil(count * 0.4);
    const hardCount = count - easyCount - mediumCount;

    const selectedEasy = easy.sort(() => 0.5 - Math.random()).slice(0, easyCount);
    const selectedMedium = medium.sort(() => 0.5 - Math.random()).slice(0, mediumCount);
    const selectedHard = hard.sort(() => 0.5 - Math.random()).slice(0, hardCount);

    return [...selectedEasy, ...selectedMedium, ...selectedHard].sort(() => 0.5 - Math.random());
  }

  /**
   * Get question by ID
   */
  getQuestionById(id: string): Question | undefined {
    return this.questionBank.find((q) => q.id === id);
  }

  /**
   * Validate answer
   */
  validateAnswer(questionId: string, answer: string): boolean {
    const question = this.getQuestionById(questionId);
    if (!question) {
      this.logger.warn(`Question not found: ${questionId}`);
      return false;
    }
    return question.correctAnswer.toLowerCase().trim() === answer.toLowerCase().trim();
  }

  /**
   * Calculate points for an answer (with time bonus)
   */
  calculatePoints(
    questionId: string,
    isCorrect: boolean,
    timeTaken: number,
    timeLimit: number = 30,
  ): number {
    if (!isCorrect) return 0;

    const question = this.getQuestionById(questionId);
    if (!question) return 0;

    let points = question.points;

    // Time bonus: up to 50% extra points for fast answers
    if (timeTaken < timeLimit) {
      const timeBonus = ((timeLimit - timeTaken) / timeLimit) * 0.5;
      points = Math.round(points * (1 + timeBonus));
    }

    return points;
  }

  /**
   * Get question statistics
   */
  getQuestionStats() {
    const total = this.questionBank.length;
    const byDifficulty = {
      easy: this.getQuestionsByDifficulty('easy').length,
      medium: this.getQuestionsByDifficulty('medium').length,
      hard: this.getQuestionsByDifficulty('hard').length,
    };

    const categories = [...new Set(this.questionBank.map((q) => q.category))];

    return {
      total,
      byDifficulty,
      categories,
    };
  }
}
