/**
 * Quiz domain interfaces
 *
 * AI Collaboration Note:
 * - Interface structure suggested by AI for type safety
 * - Properties refined based on system requirements
 */

export enum QuizStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  points: number;
}

export interface QuizSession {
  quizId: string;
  title: string;
  status: QuizStatus;
  questions: Question[];
  currentQuestionIndex: number;
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
  maxParticipants: number;
}

export interface Participant {
  userId: string;
  username: string;
  socketId: string;
  joinedAt: Date;
  score: number;
  answersSubmitted: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank: number;
  correctAnswers?: number;
  totalAnswers?: number;
}

export interface AnswerResult {
  correct: boolean;
  correctAnswer: string;
  earnedPoints: number;
  currentScore: number;
  rank: number;
}
