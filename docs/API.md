# API Reference

## REST API

**Swagger UI:** http://localhost:3000/swagger

### Endpoints

```bash
GET  /health                          # Health check
POST /quiz/create                     # Create quiz
GET  /quiz/:quizId                    # Get quiz details (includes participants & leaderboard)
```

## WebSocket API

**Connection:** `ws://localhost:3000`

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_quiz` | `{ quizId, username }` | Join quiz session |
| `start_quiz` | `{ quizId }` | Start quiz (host) |
| `submit_answer` | `{ quizId, questionId, answer, timeTaken }` | Submit answer |
| `next_question` | `{ quizId }` | Next question (host) |

### Server → Client

| Event | Description |
|-------|-------------|
| `joined_successfully` | Joined quiz + current state |
| `user_joined` | Another user joined |
| `quiz_started` | Quiz started + first question |
| `question_next` | Next question |
| `answer_result` | Answer feedback (personal) |
| `score_update` | Score changed (broadcast) |
| `leaderboard_update` | Leaderboard changed (broadcast) |
| `quiz_completed` | Quiz finished + final results |
| `error` | Error occurred |

## Usage Example

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Join quiz
socket.emit('join_quiz', { quizId: 'ABC123', username: 'Alice' });

socket.on('joined_successfully', (data) => {
  console.log('Quiz:', data.quiz.title);
  console.log('Participants:', data.participants);
});

// Listen for quiz start
socket.on('quiz_started', (data) => {
  console.log('Question:', data.question.word);
  console.log('Options:', data.question.options);
});

// Submit answer
socket.emit('submit_answer', {
  quizId: 'ABC123',
  questionId: 'q1',
  answer: 'Joyful',
  timeTaken: 12.5
});

// Get feedback
socket.on('answer_result', (data) => {
  console.log('Correct:', data.correct);
  console.log('Points:', data.earnedPoints);
  console.log('Rank:', data.rank);
});

// Watch leaderboard
socket.on('leaderboard_update', (data) => {
  data.leaderboard.forEach(entry => {
    console.log(`#${entry.rank} ${entry.username}: ${entry.score}`);
  });
});
```

**Complete examples in `client/index.html`**

## Data Structures

### Question
```typescript
{
  word: string;
  definition: string;
  options: string[];  // 4 options
}
```

### Leaderboard Entry
```typescript
{
  username: string;
  score: number;
  rank: number;      // 1-based
}
```

### Answer Result
```typescript
{
  correct: boolean;
  correctAnswer: string;
  earnedPoints: number;
  currentScore: number;
  rank: number;
}
```

---

**Test the API with Swagger UI or the test client**

