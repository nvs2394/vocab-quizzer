# System Context Diagram (C4 Level 1)

This diagram shows the high-level view of the Real-Time Vocabulary Quiz system and its users.

```mermaid
graph TB
    %% Define styles
    classDef person fill:#08427B,stroke:#073B6F,color:#fff
    classDef system fill:#1168BD,stroke:#0B4884,color:#fff
    
    %% Actors
    Student([Student<br/>Quiz participant who<br/>answers questions])
    Teacher([Teacher<br/>Quiz host who creates<br/>and controls quizzes])
    
    %% System
    QuizSystem[Vocab Quiz System<br/>---<br/>Enables real-time vocabulary<br/>quizzes with instant scoring<br/>and live leaderboards]
    
    %% Relationships
    Student -->|"Joins quizzes, submits<br/>answers, views leaderboard<br/>(WebSocket/HTTPS)"| QuizSystem
    Teacher -->|"Creates quizzes, starts<br/>quiz, controls flow<br/>(WebSocket/HTTPS)"| QuizSystem
    
    %% Apply styles
    class Student,Teacher person
    class QuizSystem system
```

## Description

**Users:**
- **Students**: Take quizzes, submit answers, and view their ranking
- **Teachers**: Create and manage quiz sessions, control quiz flow

**System:**
- **Vocab Quiz System**: Real-time vocabulary quiz platform with instant scoring and live leaderboards

**Communication:**
- WebSocket for real-time updates
- HTTPS for secure REST API calls
