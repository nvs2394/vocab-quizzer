# Redis Data Model

This diagram shows all Redis data structures used in the system.

```mermaid
graph TB
    %% Define styles
    
    subgraph "Redis Data Structures"
        direction TB
        
        subgraph "Quiz Session (Hash)"
            Session["quiz:session:{quizId}<br/>---<br/>Type: Hash<br/>---<br/>• id: string<br/>• title: string<br/>• status: 'waiting'|'active'|'ended'<br/>• currentQuestionIndex: number<br/>• totalQuestions: number<br/>• createdAt: timestamp<br/>• startedAt: timestamp"]
        end
        
        subgraph "Leaderboard (Sorted Set)"
            Scores["quiz:scores:{quizId}<br/>---<br/>Type: Sorted Set<br/>---<br/>Member: username (string)<br/>Score: total points (number)<br/>---<br/>• Auto-sorted by score (DESC)<br/>• O(log N) updates<br/>• ZINCRBY for atomic updates<br/>• ZREVRANGE for top N<br/>• ZREVRANK for rank"]
        end
        
        subgraph "Participants (Set)"
            Participants["quiz:participants:{quizId}<br/>---<br/>Type: Set<br/>---<br/>• username1<br/>• username2<br/>• username3<br/>---<br/>O(1) add/remove/check"]
        end
        
        subgraph "User Answers (Set)"
            Answers["quiz:answers:{quizId}:{username}<br/>---<br/>Type: Set<br/>---<br/>• questionId1<br/>• questionId2<br/>• questionId3<br/>---<br/>Tracks answered questions<br/>for idempotency"]
        end
        
        subgraph "Active Quizzes (Set)"
            Active["active:quizzes<br/>---<br/>Type: Set<br/>---<br/>• quizId1<br/>• quizId2<br/>---<br/>Quick lookup of active quizzes"]
        end
    end
    
    %% Relationships
    Session -.->|"quizId"| Scores
    Session -.->|"quizId"| Participants
    Participants -.->|"username"| Answers
    Session -.->|"quizId"| Active
    
    %% Apply styles
    class Session hash
    class Scores sortedset
    class Participants,Active set
    class Answers set
    
    %% Key Operations
    subgraph "Key Operations & TTL"
        Ops["⏱️ Lifecycle<br/>---<br/>• Session TTL: 24 hours<br/>• Auto-cleanup after expiry<br/>• Atomic operations prevent race conditions<br/>• All keys use quiz:{type}:{id} pattern"]
    end
    
    class Ops key
```

## Data Structure Details

### 1. Quiz Session (Hash)
**Key Pattern:** `quiz:session:{quizId}`

Stores quiz metadata and current state.

**Fields:**
- `id`: Unique quiz identifier
- `title`: Quiz title
- `status`: Current state (waiting/active/ended)
- `currentQuestionIndex`: Which question is active
- `totalQuestions`: Total number of questions
- `createdAt`: Creation timestamp
- `startedAt`: Start timestamp

### 2. Leaderboard (Sorted Set)
**Key Pattern:** `quiz:scores:{quizId}`

Maintains real-time ranking of all participants.

**Structure:**
- **Member**: Username (string)
- **Score**: Total points (float)

**Operations:**
- `ZINCRBY`: Atomically increment score
- `ZREVRANGE`: Get top N users
- `ZREVRANK`: Get user's rank (0-based)

**Why Sorted Set?**
- O(log N) updates - much faster than array sorting
- Automatic sorting by score
- Atomic operations prevent race conditions
- Perfect for leaderboards

### 3. Participants (Set)
**Key Pattern:** `quiz:participants:{quizId}`

Tracks all users who joined the quiz.

**Operations:**
- `SADD`: Add participant
- `SMEMBERS`: Get all participants
- `SISMEMBER`: Check if user joined

### 4. User Answers (Set)
**Key Pattern:** `quiz:answers:{quizId}:{username}`

Tracks which questions a user has answered (for idempotency).

**Operations:**
- `SADD`: Mark question as answered
- `SISMEMBER`: Check if already answered

### 5. Active Quizzes (Set)
**Key Pattern:** `active:quizzes`

Global set of active quiz IDs for quick lookup.

**Operations:**
- `SADD`: Add active quiz
- `SREM`: Remove ended quiz
- `SMEMBERS`: List all active quizzes

## Performance Characteristics

| Operation | Data Structure | Complexity | Latency |
|-----------|---------------|-----------|---------|
| Update score | Sorted Set (ZINCRBY) | O(log N) | < 1ms |
| Get rank | Sorted Set (ZREVRANK) | O(log N) | < 1ms |
| Get top 10 | Sorted Set (ZREVRANGE) | O(log N + 10) | < 2ms |
| Add participant | Set (SADD) | O(1) | < 1ms |
| Check answered | Set (SISMEMBER) | O(1) | < 1ms |

## TTL & Cleanup

- **Session TTL**: 24 hours
- **Auto-cleanup**: Redis automatically removes expired keys
- **Pattern**: All keys use `quiz:{type}:{id}` for easy identification
- **Atomic operations**: Prevent race conditions in concurrent scenarios
