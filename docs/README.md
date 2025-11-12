# Documentation

Complete technical documentation for the Real-Time Vocabulary Quiz application.

## 📚 Core Documentation

| Document                                 | Description                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | System design using C4 model, component descriptions, Redis data model |
| **[API.md](./API.md)**                   | Complete API reference (REST + WebSocket events)                       |
| **[DEVELOPMENT.md](./DEVELOPMENT.md)**   | Development setup, coding guidelines, and best practices               |

## 🎨 Architecture Diagrams

All diagrams use Mermaid format and render natively on GitHub.

| Diagram                                                                 | Type       | Description                      |
| ----------------------------------------------------------------------- | ---------- | -------------------------------- |
| [01-system-context.md](./diagrams/01-system-context.md)                 | C4 Level 1 | High-level system view and users |
| [02-container.md](./diagrams/02-container.md)                           | C4 Level 2 | Major technical components       |
| [03-component.md](./diagrams/03-component.md)                           | C4 Level 3 | Internal NestJS components       |
| [04-sequence-join-quiz.md](./diagrams/04-sequence-join-quiz.md)         | Sequence   | User join flow step-by-step      |
| [05-sequence-submit-answer.md](./diagrams/05-sequence-submit-answer.md) | Sequence   | Answer submission and scoring    |
| [06-redis-data-model.md](./diagrams/06-redis-data-model.md)             | Data Model | Redis data structures            |
| [07-deployment-aws.md](./diagrams/07-deployment-aws.md)                 | Deployment | Production AWS architecture      |
| [08-cicd-pipeline.md](./diagrams/08-cicd-pipeline.md)                   | CI/CD      | GitHub Actions pipeline          |

**View diagrams:** On GitHub, or use [mermaid.live](https://mermaid.live) editor.

---

## 🚀 Quick Start

**New to the project?** Start here:

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Understand the system design
2. **[API.md](./API.md)** - Learn the API endpoints
3. **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Set up your development environment

---

## 📖 Documentation Structure

```
docs/
├── README.md                        # This file
├── ARCHITECTURE.md                  # System design (C4 model)
├── API.md                           # API reference
├── DEVELOPMENT.md                   # Development guide
└── diagrams/                        # Mermaid diagrams
    ├── 01-system-context.md         # C4 Level 1
    ├── 02-container.md              # C4 Level 2
    ├── 03-component.md              # C4 Level 3
    ├── 04-sequence-join-quiz.md     # Join flow
    ├── 05-sequence-submit-answer.md # Submit flow
    ├── 06-redis-data-model.md       # Data structures
    ├── 07-deployment-aws.md         # AWS deployment
    └── 08-cicd-pipeline.md          # CI/CD pipeline
```

---

**Built for ELSA Speak Coding Challenge 2025** 🎯
