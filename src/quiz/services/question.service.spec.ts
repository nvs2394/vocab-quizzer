import { Test, TestingModule } from '@nestjs/testing';
import { QuestionService } from './question.service';

describe('QuestionService', () => {
  let service: QuestionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionService],
    }).compile();

    service = module.get<QuestionService>(QuestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllQuestions', () => {
    it('should return all questions from question bank', () => {
      const questions = service.getAllQuestions();
      expect(questions).toBeDefined();
      expect(questions.length).toBe(20);
      expect(questions[0]).toHaveProperty('id');
      expect(questions[0]).toHaveProperty('text');
      expect(questions[0]).toHaveProperty('options');
      expect(questions[0]).toHaveProperty('correctAnswer');
      expect(questions[0]).toHaveProperty('difficulty');
    });

    it('should return a copy of question bank (immutability)', () => {
      const questions1 = service.getAllQuestions();
      const questions2 = service.getAllQuestions();
      expect(questions1).not.toBe(questions2);
      expect(questions1).toEqual(questions2);
    });
  });

  describe('getQuestionsByDifficulty', () => {
    it('should return only easy questions', () => {
      const easyQuestions = service.getQuestionsByDifficulty('easy');
      expect(easyQuestions.length).toBe(5);
      easyQuestions.forEach((q) => {
        expect(q.difficulty).toBe('easy');
      });
    });

    it('should return only medium questions', () => {
      const mediumQuestions = service.getQuestionsByDifficulty('medium');
      expect(mediumQuestions.length).toBe(5);
      mediumQuestions.forEach((q) => {
        expect(q.difficulty).toBe('medium');
      });
    });

    it('should return only hard questions', () => {
      const hardQuestions = service.getQuestionsByDifficulty('hard');
      expect(hardQuestions.length).toBe(10);
      hardQuestions.forEach((q) => {
        expect(q.difficulty).toBe('hard');
      });
    });

    it('should return empty array for invalid difficulty', () => {
      const questions = service.getQuestionsByDifficulty('invalid' as any);
      expect(questions).toEqual([]);
    });
  });

  describe('getRandomQuestions', () => {
    it('should return requested number of questions', () => {
      const questions = service.getRandomQuestions(5);
      expect(questions.length).toBe(5);
    });

    it('should return all questions if requested count is larger than available', () => {
      const questions = service.getRandomQuestions(100);
      expect(questions.length).toBe(20);
    });

    it('should return different questions on multiple calls (randomness)', () => {
      const questions1 = service.getRandomQuestions(10);
      const questions2 = service.getRandomQuestions(10);

      // While it's possible they're the same, it's very unlikely
      const areIdentical = JSON.stringify(questions1) === JSON.stringify(questions2);
      // Note: This test might occasionally fail due to randomness, but it's rare
      expect(areIdentical).toBe(false);
    });

    it('should handle edge case of 0 questions', () => {
      const questions = service.getRandomQuestions(0);
      expect(questions.length).toBe(0);
    });
  });

  describe('getBalancedQuestions', () => {
    it('should return 10 questions with balanced difficulty distribution', () => {
      const questions = service.getBalancedQuestions(10);
      expect(questions.length).toBe(10);

      const difficulties = questions.map((q) => q.difficulty);
      const easyCount = difficulties.filter((d) => d === 'easy').length;
      const mediumCount = difficulties.filter((d) => d === 'medium').length;
      const hardCount = difficulties.filter((d) => d === 'hard').length;

      // 40% easy (4), 40% medium (4), 20% hard (2)
      expect(easyCount).toBe(4);
      expect(mediumCount).toBe(4);
      expect(hardCount).toBe(2);
    });

    it('should return 5 questions with balanced distribution', () => {
      const questions = service.getBalancedQuestions(5);
      expect(questions.length).toBe(5);

      const difficulties = questions.map((q) => q.difficulty);
      const easyCount = difficulties.filter((d) => d === 'easy').length;
      const mediumCount = difficulties.filter((d) => d === 'medium').length;
      const hardCount = difficulties.filter((d) => d === 'hard').length;

      // 40% easy (2), 40% medium (2), 20% hard (1)
      expect(easyCount).toBe(2);
      expect(mediumCount).toBe(2);
      expect(hardCount).toBe(1);
    });
  });

  describe('getQuestionById', () => {
    it('should return question with matching ID', () => {
      const question = service.getQuestionById('q1');
      expect(question).toBeDefined();
      expect(question?.id).toBe('q1');
      expect(question?.text).toBe('What does "happy" mean?');
    });

    it('should return undefined for non-existent ID', () => {
      const question = service.getQuestionById('invalid-id');
      expect(question).toBeUndefined();
    });
  });

  describe('validateAnswer', () => {
    it('should return true for correct answer (case insensitive)', () => {
      const isCorrect1 = service.validateAnswer('q1', 'Joyful');
      const isCorrect2 = service.validateAnswer('q1', 'joyful');
      const isCorrect3 = service.validateAnswer('q1', 'JOYFUL');

      expect(isCorrect1).toBe(true);
      expect(isCorrect2).toBe(true);
      expect(isCorrect3).toBe(true);
    });

    it('should return false for incorrect answer', () => {
      const isCorrect = service.validateAnswer('q1', 'Sad');
      expect(isCorrect).toBe(false);
    });

    it('should return false for non-existent question', () => {
      const isCorrect = service.validateAnswer('invalid-id', 'Some answer');
      expect(isCorrect).toBe(false);
    });

    it('should trim whitespace from answers', () => {
      const isCorrect = service.validateAnswer('q1', '  Joyful  ');
      expect(isCorrect).toBe(true);
    });
  });

  describe('calculatePoints', () => {
    it('should return 0 points for incorrect answer', () => {
      const points = service.calculatePoints('q1', false, 10);
      expect(points).toBe(0);
    });

    it('should return base points for correct answer with no time bonus', () => {
      const points = service.calculatePoints('q1', true, 30, 30);
      expect(points).toBe(10); // Base points for easy question
    });

    it('should add time bonus for fast correct answers', () => {
      const points = service.calculatePoints('q1', true, 10, 30);

      // Expected: 10 * (1 + ((30-10)/30) * 0.5) = 10 * 1.333 = 13.33 -> 13
      expect(points).toBeGreaterThan(10);
      expect(points).toBeLessThanOrEqual(15);
    });

    it('should return max bonus for instant answer', () => {
      const points = service.calculatePoints('q1', true, 0, 30);

      // Expected: 10 * (1 + ((30-0)/30) * 0.5) = 10 * 1.5 = 15
      expect(points).toBe(15);
    });

    it('should return 0 for non-existent question', () => {
      const points = service.calculatePoints('invalid-id', true, 10);
      expect(points).toBe(0);
    });

    it('should calculate correctly for hard questions with higher base points', () => {
      const points = service.calculatePoints('q11', true, 0, 30);

      // Expected: 20 * (1 + ((30-0)/30) * 0.5) = 20 * 1.5 = 30
      expect(points).toBe(30);
    });
  });

  describe('getQuestionStats', () => {
    it('should return correct question statistics', () => {
      const stats = service.getQuestionStats();

      expect(stats.total).toBe(20);
      expect(stats.byDifficulty.easy).toBe(5);
      expect(stats.byDifficulty.medium).toBe(5);
      expect(stats.byDifficulty.hard).toBe(10);
      expect(stats.categories).toBeDefined();
      expect(stats.categories.length).toBeGreaterThan(0);
    });

    it('should include all unique categories', () => {
      const stats = service.getQuestionStats();

      expect(stats.categories).toContain('emotions');
      expect(stats.categories).toContain('adjectives');
      expect(stats.categories).toContain('verbs');
      expect(stats.categories).toContain('advanced');
    });
  });
});
