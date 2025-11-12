#!/usr/bin/env node

/**
 * Simple Quiz Test Script
 * Run: node test-quiz.js
 */

const io = require('socket.io-client');

console.log('🎯 Quiz Test Script Starting...\n');

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling']
});

let quizId = null;
let currentQuestionId = null;

// Listen for quiz_created event
socket.on('quiz_created', (data) => {
  console.log('✅ Quiz created successfully!');
  console.log('   Response data:', data);
  quizId = data.quizId || data.data?.quizId;
  console.log('   Quiz ID:', quizId);
  console.log('');
  
  // Step 2: Join Quiz
  console.log('📝 Step 2: Joining quiz...');
  socket.emit('join_quiz', { 
    quizId: quizId, 
    username: 'Test Bot' 
  });
});

// Connect
socket.on('connect', () => {
  console.log('✅ Connected to server');
  console.log('   Socket ID:', socket.id);
  console.log('');
  
  // Step 1: Create Quiz
  console.log('📝 Step 1: Creating quiz...');
  socket.emit('create_quiz', { 
    title: 'Automated Test Quiz', 
    questionCount: 3 
  });
});

// Joined successfully
socket.on('joined_successfully', (data) => {
  console.log('✅ Joined quiz successfully!');
  console.log('   Response data:', data);
  
  // Handle different response structures
  const participants = data.data?.participants || data.participants || [];
  console.log('   Participants:', participants.length);
  console.log('');
  
  // Step 3: Start Quiz
  console.log('📝 Step 3: Starting quiz...');
  socket.emit('start_quiz', { quizId: quizId });
});

// Quiz started - got first question
socket.on('quiz_started', (data) => {
  console.log('✅ Quiz started!');
  console.log('');
  handleQuestion(data);
});

// Next question
socket.on('question_next', (data) => {
  console.log('');
  handleQuestion(data);
});

// Answer result
socket.on('answer_result', (data) => {
  console.log('');
  console.log('📊 Answer Result:');
  console.log('   Correct:', data.correct ? '✅ YES' : '❌ NO');
  console.log('   Points earned:', data.earnedPoints);
  console.log('   Time bonus:', data.timeBonus);
  console.log('   Current score:', data.currentScore);
  console.log('   Correct answer was:', data.correctAnswer);
  
  // Wait a bit then get next question
  setTimeout(() => {
    console.log('');
    console.log('📝 Getting next question...');
    socket.emit('next_question', { quizId: quizId });
  }, 1000);
});

// Quiz completed
socket.on('quiz_completed', (data) => {
  console.log('');
  console.log('🎉 Quiz Completed!');
  console.log('');
  console.log('📊 Final Leaderboard:');
  data.leaderboard.forEach((entry, idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  ';
    console.log(`   ${medal} #${entry.rank} ${entry.username}: ${entry.score} points`);
  });
  console.log('');
  console.log('✅ Test completed successfully!');
  process.exit(0);
});

// Error handling
socket.on('error', (data) => {
  console.error('❌ Error:', data.message || data);
  console.error('   Full error data:', data);
  process.exit(1);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.error('   Make sure the server is running: npm run start:dev');
  process.exit(1);
});

// Catch all other events for debugging
socket.onAny((eventName, ...args) => {
  console.log(`[DEBUG] Event received: ${eventName}`);
  if (args.length > 0) {
    console.log('[DEBUG] Event data:', JSON.stringify(args, null, 2));
  }
});

// Handle question
function handleQuestion(data) {
  console.log('[DEBUG] handleQuestion received data:', JSON.stringify(data, null, 2));
  
  const questionNum = data.questionNumber || 1;
  const totalQuestions = data.quiz?.totalQuestions || data.totalQuestions || 10;
  const question = data.question;
  
  console.log('[DEBUG] Question object:', JSON.stringify(question, null, 2));
  console.log('[DEBUG] Question ID:', question.id);
  
  if (!question.id) {
    console.error('❌ ERROR: Question has no ID!');
    console.error('   Question object:', question);
    process.exit(1);
  }
  
  currentQuestionId = question.id;
  
  console.log(`❓ Question ${questionNum}/${totalQuestions}`);
  console.log('   ', question.text);
  console.log('');
  console.log('   Options:');
  question.options.forEach((opt, idx) => {
    console.log(`   ${idx + 1}. ${opt}`);
  });
  console.log('');
  
  // Randomly select an answer (for testing)
  const randomAnswer = question.options[Math.floor(Math.random() * question.options.length)];
  console.log('📤 Submitting answer:', randomAnswer);
  
  const payload = {
    quizId: quizId,
    questionId: currentQuestionId,
    answer: randomAnswer,
    timeTaken: Math.floor(Math.random() * 10) + 1
  };
  
  console.log('[DEBUG] Submit answer payload:', JSON.stringify(payload, null, 2));
  console.log('[DEBUG] currentQuestionId value:', currentQuestionId);
  console.log('[DEBUG] quizId value:', quizId);
  
  socket.emit('submit_answer', payload);
}

// Timeout after 30 seconds
setTimeout(() => {
  console.error('❌ Test timeout after 30 seconds');
  process.exit(1);
}, 30000);

