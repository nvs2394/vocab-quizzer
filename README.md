# 🎯 Real-Time Vocabulary Quiz Application

Real-time quiz system built with **NestJS, Socket.IO, and Redis** for ELSA Speak coding challenge.

## Overview

Multiple users participate in synchronized vocabulary quizzes with:

- ✅ Instant score updates via WebSocket
- ✅ Live leaderboard with real-time rankings
- ✅ Time-based scoring (faster = more points)
- ✅ 20 vocabulary questions across 3 difficulty levels

**Tech Stack:** NestJS + Socket.IO + Redis + TypeScript

## Documentation

- **[Architecture](./docs/ARCHITECTURE.md)** - System design and technical decisions
- **[API Reference](./docs/API.md)** - REST & WebSocket API documentation
- **[Development](./docs/DEVELOPMENT.md)** - Setup guide and coding guidelines
- **[Testing Guide](./docs/TESTING.md)** - Unit tests and best practices
- **[Test Summary](./TEST_SUMMARY.md)** - Test coverage overview

## Quick Start

**Prerequisites:** Node.js v18+, Redis v6+

```bash
# Install dependencies
npm install

# Start Redis
brew install redis && brew services start redis  # macOS
# or: sudo apt install redis-server              # Ubuntu

# Start application
npm run start:dev

# Open test client
open client/index.html
```

**URLs:**

- **Application:** http://localhost:3000
- **Swagger API:** http://localhost:3000/api
- **Test Client:** `client/index.html`

## 🚀 Quick Testing (Choose One)

### Option 1: Automated Script (Easiest!)

```bash
node test-quiz.js
```

Runs a complete quiz flow automatically - no manual interaction needed!

### Option 2: Simple HTML Client

```bash
open client/simple.html
```

Basic UI with clear steps 1-5. No fancy animations, just buttons!

### Option 3: Swagger UI (REST API only)

```
http://localhost:3000/api
```

Test REST endpoints directly in browser.

### Option 4: cURL Commands

```bash
# Create quiz
curl -X POST http://localhost:3000/quiz/create \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","questionCount":5}'

# Get quiz (replace ABC123 with your quiz ID)
curl http://localhost:3000/quiz/ABC123
```

See **[QUICK_API_TEST.md](./QUICK_API_TEST.md)** for complete cURL examples and Postman collection.

### Option 5: Full Featured Client

```bash
open client/index.html
```

Complete test client with progress indicators, timers, and all testing features.

---

## Testing

### 🧪 Interactive Test Client

The enhanced test client includes comprehensive testing features:

- ⏱️ **Timer** - Visible countdown with time-based scoring
- 🔄 **Reconnection** - Test disconnect/reconnect scenarios
- 🔁 **Idempotency** - Test duplicate submission prevention
- 👥 **Multi-user** - Open multiple tabs for real-time testing
- 📊 **Statistics** - View quiz stats and connection count
- ⚠️ **Edge Cases** - Built-in buttons to test error scenarios

### Quick Test (Single User)

1. Open `client/index.html`
2. Create a new quiz
3. Join with your name
4. Start quiz and answer questions
5. Use "Testing Controls" section to test edge cases

### Multi-User Test (Real-time Features)

1. Open `client/index.html` in **3 browser tabs**
2. Create quiz in tab 1, copy Quiz ID
3. Join same quiz in all 3 tabs with different names
4. Start quiz and answer at different speeds
5. Watch real-time leaderboard updates across all tabs

**See [CLIENT_TESTING_GUIDE.md](./CLIENT_TESTING_GUIDE.md) for comprehensive testing guide**

## 🧪 Unit Tests

The project has **166+ unit tests** with **~95% code coverage**.

```bash
# Run all unit tests
npm test

# Test with coverage report
npm run test:cov

# Watch mode for development
npm run test:watch
```

**Test Summary:**

- ✅ QuizService: 45+ tests (business logic, idempotency, scoring)
- ✅ QuizGateway: 32+ tests (WebSocket events, broadcasting)
- ✅ RedisService: 38+ tests (data operations, sorted sets)
- ✅ QuestionService: 25+ tests (scoring algorithm, validation)
- ✅ QuizController: 22+ tests (REST endpoints)

**Troubleshooting:** If you encounter `@jest/test-sequencer` error:

```bash
bash fix-tests.sh  # or manually remove @jest/test-sequencer from package.json
```

See **[TEST_SUMMARY.md](./TEST_SUMMARY.md)** and **[docs/TESTING.md](./docs/TESTING.md)** for details.

## Project Structure

```
src/
├── quiz/
│   ├── quiz.gateway.ts         # WebSocket events
│   ├── quiz.service.ts         # Business logic
│   ├── question.service.ts     # Question management
│   └── dto/                    # Input validation
├── redis/
│   └── redis.service.ts        # Data access layer
└── main.ts                     # Entry point

client/
└── index.html                  # Test client

docs/
├── ARCHITECTURE.md             # System design
├── API.md                      # API reference
└── DEVELOPMENT.md              # Setup & guidelines
```

## Key Features

- **Real-time Communication:** Socket.IO for bidirectional WebSocket
- **Fast Data Access:** Redis Sorted Sets for O(log N) leaderboard operations
- **Atomic Updates:** Race-condition-free scoring with Redis ZINCRBY
- **Room Broadcasting:** Isolated quiz sessions
- **Type Safety:** TypeScript + NestJS decorators
- **API Documentation:** Interactive Swagger UI

---

Built for **ELSA Speak Coding Challenge 2025** 🎯

_This project was built with AI assistance (Cursor AI, GitHub Copilot, ChatGPT) and thoroughly reviewed and tested._
