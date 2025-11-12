# CI/CD Pipeline

This document describes the continuous integration and deployment pipeline for the Real-Time Vocabulary Quiz application.

```mermaid
graph LR
    %% Developer workflow
    Dev[Developer] -->|Push Code| GitHub[GitHub Repository]

    %% CI/CD Pipeline
    GitHub -->|Trigger| Actions[GitHub Actions]

    subgraph Pipeline["CI/CD Pipeline"]
        Actions --> Checkout[Checkout Code]
        Checkout --> Install[Install Dependencies]
        Install --> Lint[Run Linter]
        Lint --> Test[Run Tests]
        Test --> Build[Build Docker Image]
        Build --> Scan[Security Scan]
        Scan --> Push[Push to ECR]
        Push --> Deploy[Deploy to ECS]
    end

    %% AWS Integration
    Push --> ECR[AWS ECR<br/>Container Registry]
    Deploy --> ECS[AWS ECS<br/>Fargate]

    %% Verification
    ECS --> Verify[Health Check]
    Verify -->|Success| Done[Deployment Complete]
    Verify -->|Failure| Rollback[Automatic Rollback]
```

## Pipeline Overview

### Trigger Events

- **Push to main branch**: Full CI/CD pipeline
- **Pull Request**: Build and test only (no deployment)
- **Manual trigger**: Deploy specific version

### Pipeline Stages

| Stage        | Purpose                     |
| ------------ | --------------------------- |
| **Checkout** | Get latest code             |
| **Install**  | Install dependencies        |
| **Lint**     | Code quality check          |
| **Test**     | Run all tests               |
| **Build**    | Create Docker image         |
| **Scan**     | Security vulnerability scan |
| **Push**     | Upload to ECR               |
| **Deploy**   | Update ECS service          |
