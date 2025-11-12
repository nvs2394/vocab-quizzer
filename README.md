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

## Quick Start

**Prerequisites:** Node.js v20+, Redis v6+

### Option 1: Local Development (Recommended)

```bash
# Install dependencies
npm install

# Start Redis with Docker (easiest)
docker-compose up -d

# Or install Redis locally
# macOS: brew install redis && brew services start redis
# Ubuntu: sudo apt install redis-server

# Start application
npm run start:dev
```

### Option 2: Full Docker Stack

```bash
# Build and run both Redis and app in containers
docker-compose up --build

# Stop when done
docker-compose down
```

**URLs:**

- **Application:** http://localhost:3000
- **Swagger API:** http://localhost:3000/swagger
- **Health Check:** http://localhost:3000/health

## 🚀 Quick Testing

### Option 1: Automated Script (Easiest!)

```bash
# Complete end-to-end test with automated quiz flow
node test-quiz.js
```

Creates quiz, joins, answers questions, and displays leaderboard automatically!

### Option 2: Interactive HTML Client

```bash
# Open in browser
open client/index.html
```

Full-featured test client with real-time updates, timers, and testing controls.

### Option 3: Swagger UI

```bash
# Open in browser
http://localhost:3000/swagger
```

Interactive API documentation - test REST endpoints directly.

---

## 🧪 Testing

```bash
# Run all unit tests
npm test

# Test with coverage report
npm run test:cov

# Watch mode for development
npm run test:watch
```

## 🔄 CI/CD Pipeline

The project includes a GitHub Actions workflow for automated testing and quality checks.

**Workflow:** `.github/workflows/ci.yml`

### What Gets Checked

Every push and pull request triggers:

- ✅ **Linting** - ESLint code quality checks
- ✅ **Formatting** - Prettier code style checks
- ✅ **Unit Tests** - All 110+ tests (using mocked Redis)
- ✅ **Test Coverage** - Coverage report generation
- ✅ **Build** - Application build verification
- ✅ **Security** - npm audit for vulnerabilities

### Pipeline Stages

```
Checkout → Install → Lint → Test → Coverage → Build
                           ↓
                    Security Scan
```

### Run Locally

Run the same checks that CI runs:

```bash
npm ci              # Clean install
npm run lint        # Linting
npm run format      # Formatting
npm test            # Tests
npm run test:cov    # Coverage
npm run build       # Build
```

**See:** [CI/CD Pipeline Diagram](./docs/diagrams/08-cicd-pipeline.md) for visual overview.

## Project Structure

```
src/
├── quiz/
│   ├── quiz.gateway.ts          # WebSocket events (5 handlers)
│   ├── quiz.controller.ts       # REST API (2 endpoints)
│   ├── services/
│   │   ├── quiz.service.ts      # Business logic
│   │   └── question.service.ts  # Question management
│   ├── data/
│   │   └── question-bank.data.ts # 20 vocabulary questions
│   └── dto/                     # Input validation
├── redis/
│   └── redis.service.ts         # Data access layer
└── main.ts                      # Application entry point

client/
├── index.html                   # Interactive test client
└── test-quiz.js                 # Automated test script

.github/
└── workflows/
    └── ci.yml                   # GitHub Actions CI pipeline

docs/
├── ARCHITECTURE.md              # C4 model system design
├── API.md                       # Complete API reference
├── DEVELOPMENT.md               # Development guide
└── diagrams/                    # Mermaid diagrams
    ├── 01-system-context.md
    ├── 02-container.md
    ├── 03-component.md
    ├── 04-sequence-join-quiz.md
    ├── 05-sequence-submit-answer.md
    ├── 06-redis-data-model.md
    ├── 07-deployment-aws.md
    └── 08-cicd-pipeline.md
```
