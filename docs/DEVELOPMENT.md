# Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Start Redis
redis-server

# Start dev server
npm run start:dev

# Open test client
open client/index.html
```

## Prerequisites

- Node.js v18+
- Redis v6+

**Install Redis:**
```bash
# macOS
brew install redis && brew services start redis

# Ubuntu
sudo apt install redis-server
```

## NPM Scripts

```bash
npm run start:dev      # Development with hot reload
npm run build          # Build for production
npm test               # Run tests
npm run lint           # Check linting
npm run format         # Format code
```

## Project Structure

```
src/
├── quiz/
│   ├── quiz.gateway.ts         # WebSocket events
│   ├── quiz.controller.ts      # REST endpoints
│   ├── services/
│   │   ├── quiz.service.ts     # Business logic
│   │   └── question.service.ts # Question management
│   ├── dto/                    # Input validation
│   └── interfaces/             # TypeScript types
└── redis/
    └── redis.service.ts        # Redis operations
```

## Code Conventions

### TypeScript
- Use explicit types for function returns
- Interfaces for object shapes
- No `any` types

```typescript
// Good
function calculateScore(points: number): number {
  return points;
}

// Bad
function calculateScore(points) {
  return points;
}
```

### NestJS Patterns
- Use dependency injection
- DTOs for validation
- Services for business logic
- Controllers/Gateways for I/O

```typescript
@Injectable()
export class QuizService {
  constructor(
    private readonly redis: RedisService,
    private readonly logger: Logger,
  ) {}
}
```

### Testing
- Unit tests: `*.spec.ts`
- E2E tests: `*.e2e-spec.ts`
- Follow Arrange-Act-Assert pattern

```typescript
it('should calculate score with bonus', () => {
  // Arrange
  const timeTaken = 10;
  
  // Act
  const score = service.calculateScore(timeTaken, 30);
  
  // Assert
  expect(score).toBeGreaterThan(10);
});
```

## Git Commits

```bash
feat(quiz): add time-based scoring
fix(gateway): handle disconnection
docs: update API reference
```

## Debugging

### VS Code Launch Config
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug NestJS",
  "runtimeArgs": ["-r", "ts-node/register"],
  "args": ["${workspaceFolder}/src/main.ts"],
  "sourceMaps": true
}
```

## Troubleshooting

**Redis connection error:**
```bash
redis-cli ping  # Should return PONG
```

**Port in use:**
```bash
lsof -i :3000
kill -9 <PID>
```

**Clear Redis data:**
```bash
redis-cli FLUSHDB
```

---

**Check Swagger UI (http://localhost:3000/swagger) for API testing**

