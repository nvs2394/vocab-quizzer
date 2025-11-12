# Component Diagram (C4 Level 3)

This diagram shows the internal components of the NestJS Application.

```mermaid
graph TB
    %% Define styles
    classDef container fill:#438DD5,stroke:#3C7FC0,color:#fff
    classDef component fill:#85BBF0,stroke:#78A8D8,color:#000
    classDef database fill:#999999,stroke:#8A8A8A,color:#fff
    
    %% External Containers
    WebApp["Web Browser<br/>Socket.IO Client"]
    Redis[("Redis<br/>Data Store")]
    
    %% NestJS Components
    subgraph Backend["NestJS Application"]
        Gateway["Quiz Gateway<br/>---<br/>WebSocket<br/>---<br/>Handles Socket.IO events<br/>and connections"]
        
        Controller["Quiz Controller<br/>---<br/>REST<br/>---<br/>Handles HTTP requests<br/>for quiz management"]
        
        QuizService["Quiz Service<br/>---<br/>Business Logic<br/>---<br/>Core quiz logic:<br/>create, join, submit, score"]
        
        QuestionService["Question Service<br/>---<br/>Business Logic<br/>---<br/>Manages question bank<br/>and selection"]
        
        RedisService["Redis Service<br/>---<br/>Data Access<br/>---<br/>Abstracts Redis operations"]
    end
    
    %% Relationships
    WebApp -->|"WebSocket events<br/>(Socket.IO)"| Gateway
    WebApp -->|"REST API<br/>(HTTPS)"| Controller
    
    Gateway --> QuizService
    Controller --> QuizService
    QuizService --> QuestionService
    QuizService --> RedisService
    RedisService -->|"Commands<br/>(ioredis)"| Redis
    
    %% Apply styles
    class WebApp container
    class Gateway,Controller,QuizService,QuestionService,RedisService component
    class Redis database
```

## Component Responsibilities

| Component | Layer | Responsibility |
|-----------|-------|----------------|
| **Quiz Gateway** | Presentation | Handle WebSocket connections and events (join, submit, etc.) |
| **Quiz Controller** | Presentation | Handle HTTP REST API endpoints |
| **Quiz Service** | Business Logic | Core quiz operations (create, join, submit, scoring) |
| **Question Service** | Business Logic | Question bank management and answer validation |
| **Redis Service** | Data Access | Abstract Redis operations (CRUD, leaderboard queries) |

## Architecture Pattern

**Layered Architecture:**
- **Presentation Layer**: Gateway + Controller
- **Business Logic Layer**: Quiz Service + Question Service
- **Data Access Layer**: Redis Service
- **Data Storage**: Redis
