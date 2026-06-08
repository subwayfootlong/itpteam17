# Workflow Rules

## Branching Strategy

Main development should happen on feature branches.

- Use `feature/uc-[id]-[short-description]` for feature work.
- Use `bugfix/[short-description]` for fixes.
- Protect the `main` branch.

## Continuous Deployment

Pushing or merging to verified deployment branches should trigger the build and deployment pipeline for the cloud hosting environment.