/**
 * Question Bank Data
 *
 * AI Collaboration Note:
 * - Sample vocabulary questions generated using ChatGPT
 * - Prompt: "Generate 20 English vocabulary quiz questions with multiple choice answers suitable for language learners"
 * - Verification: Reviewed all questions for accuracy and difficulty levels
 * - Refinement: Adjusted difficulty distribution and added more diverse vocabulary
 */

import { Question } from '../interfaces/quiz.interface';

export const QUESTION_BANK: Question[] = [
  // Easy Questions
  {
    id: 'q1',
    text: 'What does "happy" mean?',
    options: ['Sad', 'Joyful', 'Angry', 'Tired'],
    correctAnswer: 'Joyful',
    difficulty: 'easy',
    category: 'emotions',
    points: 10,
  },
  {
    id: 'q2',
    text: 'Choose the synonym of "big"?',
    options: ['Small', 'Large', 'Tiny', 'Little'],
    correctAnswer: 'Large',
    difficulty: 'easy',
    category: 'adjectives',
    points: 10,
  },
  {
    id: 'q3',
    text: 'What is the opposite of "hot"?',
    options: ['Warm', 'Cold', 'Cool', 'Freezing'],
    correctAnswer: 'Cold',
    difficulty: 'easy',
    category: 'antonyms',
    points: 10,
  },
  {
    id: 'q4',
    text: 'What does "eat" mean?',
    options: ['To drink', 'To sleep', 'To consume food', 'To run'],
    correctAnswer: 'To consume food',
    difficulty: 'easy',
    category: 'verbs',
    points: 10,
  },
  {
    id: 'q5',
    text: 'Choose the correct spelling:',
    options: ['Freind', 'Friend', 'Frend', 'Friand'],
    correctAnswer: 'Friend',
    difficulty: 'easy',
    category: 'spelling',
    points: 10,
  },

  // Medium Questions
  {
    id: 'q6',
    text: 'What does "ambitious" mean?',
    options: [
      'Lazy and unmotivated',
      'Having strong desire to succeed',
      'Feeling tired',
      'Being friendly',
    ],
    correctAnswer: 'Having strong desire to succeed',
    difficulty: 'medium',
    category: 'adjectives',
    points: 15,
  },
  {
    id: 'q7',
    text: 'Choose the synonym of "demonstrate"?',
    options: ['Hide', 'Show', 'Forget', 'Ignore'],
    correctAnswer: 'Show',
    difficulty: 'medium',
    category: 'verbs',
    points: 15,
  },
  {
    id: 'q8',
    text: 'What does "reluctant" mean?',
    options: ['Very eager', 'Unwilling', 'Happy', 'Excited'],
    correctAnswer: 'Unwilling',
    difficulty: 'medium',
    category: 'adjectives',
    points: 15,
  },
  {
    id: 'q9',
    text: 'Choose the word that best completes: "The evidence was ___ enough to convince the jury."',
    options: ['Compelling', 'Boring', 'Weak', 'Funny'],
    correctAnswer: 'Compelling',
    difficulty: 'medium',
    category: 'context',
    points: 15,
  },
  {
    id: 'q10',
    text: 'What is the meaning of "procrastinate"?',
    options: ['To work quickly', 'To delay or postpone', 'To celebrate', 'To organize'],
    correctAnswer: 'To delay or postpone',
    difficulty: 'medium',
    category: 'verbs',
    points: 15,
  },

  // Hard Questions
  {
    id: 'q11',
    text: 'What does "ephemeral" mean?',
    options: [
      'Lasting for a very short time',
      'Eternal and everlasting',
      'Heavy and solid',
      'Brightly colored',
    ],
    correctAnswer: 'Lasting for a very short time',
    difficulty: 'hard',
    category: 'advanced',
    points: 20,
  },
  {
    id: 'q12',
    text: 'Choose the synonym of "ubiquitous"?',
    options: ['Rare', 'Omnipresent', 'Ancient', 'Modern'],
    correctAnswer: 'Omnipresent',
    difficulty: 'hard',
    category: 'advanced',
    points: 20,
  },
  {
    id: 'q13',
    text: 'What does "esoteric" mean?',
    options: [
      'Common and ordinary',
      'Understood by few; specialized',
      'Very expensive',
      'Extremely large',
    ],
    correctAnswer: 'Understood by few; specialized',
    difficulty: 'hard',
    category: 'advanced',
    points: 20,
  },
  {
    id: 'q14',
    text: 'Choose the correct usage of "ameliorate"?',
    options: ['To make worse', 'To make better', 'To describe', 'To remember'],
    correctAnswer: 'To make better',
    difficulty: 'hard',
    category: 'verbs',
    points: 20,
  },
  {
    id: 'q15',
    text: 'What is the meaning of "sycophant"?',
    options: [
      'A brave leader',
      'A person who flatters to gain advantage',
      'A talented artist',
      'An honest critic',
    ],
    correctAnswer: 'A person who flatters to gain advantage',
    difficulty: 'hard',
    category: 'nouns',
    points: 20,
  },
  {
    id: 'q16',
    text: 'What does "perspicacious" mean?',
    options: ['Confused and unclear', 'Having keen insight', 'Very tall', 'Extremely wealthy'],
    correctAnswer: 'Having keen insight',
    difficulty: 'hard',
    category: 'advanced',
    points: 20,
  },
  {
    id: 'q17',
    text: 'Choose the synonym of "obfuscate"?',
    options: ['Clarify', 'Confuse', 'Simplify', 'Explain'],
    correctAnswer: 'Confuse',
    difficulty: 'hard',
    category: 'verbs',
    points: 20,
  },
  {
    id: 'q18',
    text: 'What does "magnanimous" mean?',
    options: ['Selfish and greedy', 'Generous and forgiving', 'Angry and bitter', 'Shy and quiet'],
    correctAnswer: 'Generous and forgiving',
    difficulty: 'hard',
    category: 'adjectives',
    points: 20,
  },
  {
    id: 'q19',
    text: 'What is a "panacea"?',
    options: [
      'A solution for all problems',
      'A type of disease',
      'A small amount',
      'A religious ceremony',
    ],
    correctAnswer: 'A solution for all problems',
    difficulty: 'hard',
    category: 'nouns',
    points: 20,
  },
  {
    id: 'q20',
    text: 'What does "recalcitrant" mean?',
    options: [
      'Obedient and compliant',
      'Stubbornly resistant to authority',
      'Very intelligent',
      'Extremely fast',
    ],
    correctAnswer: 'Stubbornly resistant to authority',
    difficulty: 'hard',
    category: 'adjectives',
    points: 20,
  },
];
