# Container Diagram (C4 Level 2)

This diagram shows the major containers (applications and data stores) that make up the system.

```mermaid
graph TB
    %% Define styles
    classDef person fill:#08427B,stroke:#073B6F,color:#fff
    classDef container fill:#438DD5,stroke:#3C7FC0,color:#fff
    classDef database fill:#999999,stroke:#8A8A8A,color:#fff
    
    %% Actor
    User([User<br/>Student or Teacher])
    
    %% Containers
    WebApp["Web Browser<br/>---<br/>HTML/JavaScript<br/>Socket.IO Client<br/>---<br/>Provides real-time<br/>quiz interface"]
    
    Backend["NestJS Application<br/>---<br/>TypeScript, NestJS<br/>Socket.IO Server<br/>---<br/>Handles WebSocket connections,<br/>REST APIs, business logic"]
    
    Redis[("Redis<br/>---<br/>In-memory data store<br/>---<br/>Stores sessions, scores,<br/>participants")]
    
    %% Relationships
    User -->|"Uses<br/>(HTTPS)"| WebApp
    WebApp <-->|"Real-time events,<br/>REST API<br/>(WebSocket, HTTPS)"| Backend
    Backend <-->|"Reads/writes data<br/>(TCP)"| Redis
    
    %% Apply styles
    class User person
    class WebApp,Backend container
    class Redis database
```

## Container Details

| Container | Technology | Responsibility |
|-----------|-----------|----------------|
| **Web Browser** | HTML/JS + Socket.IO | User interface, real-time event handling |
| **NestJS Application** | TypeScript + NestJS | Business logic, WebSocket server, REST API |
| **Redis** | In-memory database | Session state, leaderboards, participant data |

## Communication Protocols

- **HTTPS**: Secure REST API calls
- **WebSocket**: Real-time bidirectional communication
- **TCP**: Redis protocol communication
