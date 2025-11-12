# Sequence Diagram: User Joins Quiz

This diagram shows the complete flow when a user joins a quiz session.

```mermaid
sequenceDiagram
    actor User
    participant Gateway as Quiz Gateway
    participant Service as Quiz Service
    participant Redis as Redis Service
    participant DB as Redis DB

    User->>+Gateway: emit('join_quiz', {quizId, username})
    
    Gateway->>+Service: joinQuiz(quizId, username)
    
    Service->>+Redis: getQuizSession(quizId)
    Redis->>DB: HGETALL quiz:session:{quizId}
    DB-->>Redis: quiz data
    Redis-->>-Service: QuizSession
    
    Service->>+Redis: addParticipant(quizId, username)
    Redis->>DB: SADD quiz:participants:{quizId} username
    Redis->>DB: ZADD quiz:scores:{quizId} 0 username
    DB-->>Redis: OK
    Redis-->>-Service: success
    
    Service->>+Redis: getLeaderboard(quizId)
    Redis->>DB: ZREVRANGE quiz:scores:{quizId} 0 -1 WITHSCORES
    DB-->>Redis: leaderboard
    Redis-->>-Service: leaderboard[]
    
    Service-->>-Gateway: {quiz, participants, leaderboard}
    
    Gateway->>User: emit('joined_successfully', data)
    Gateway->>Gateway: socket.join('quiz:{quizId}')
    Gateway->>User: broadcast('user_joined', {username})
    deactivate Gateway
```

## Flow Steps

1. **User emits join request** - Client sends `join_quiz` event with quiz ID and username
2. **Gateway receives event** - WebSocket gateway handles the connection
3. **Service validates quiz** - Checks if quiz exists and is joinable
4. **Add to participants** - User added to quiz participant set
5. **Initialize score** - User score set to 0 in leaderboard
6. **Get current state** - Fetch current leaderboard
7. **Confirm join** - Send confirmation to user with quiz data
8. **Join room** - Add socket to quiz room for broadcasts
9. **Broadcast** - Notify all participants that a new user joined

## Performance

- **Total latency**: < 10ms
- **Redis operations**: 4 commands (1 HGETALL, 1 SADD, 1 ZADD, 1 ZREVRANGE)
- **Complexity**: O(log N) for sorted set operations
