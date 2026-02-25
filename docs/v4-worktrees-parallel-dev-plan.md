# V4 Parallel Development with Git Worktrees Plan

## Overview

This document outlines the strategy for developing Agent Eval Tool V4 features in parallel using Git worktrees. Each feature will be developed in isolation to avoid conflicts, then integrated through a structured merge process.

## Git Worktrees Concept

Git worktrees allow you to check out multiple branches simultaneously in separate working directories while sharing the same Git repository. This enables parallel development without branch switching conflicts.

**Benefits:**
- No need to stash/commit work when switching between features
- True parallel development without interference
- Shared Git history and configuration
- Independent dependency installations per feature
- Isolated testing environments

---

## Feature Breakdown

Based on **v4-features-plan.md**, we have 5 features to develop:

| Feature | Priority | Complexity | Estimated Timeline |
|---------|----------|------------|-------------------|
| **Feature #1**: API vs TDX CLI Performance | High | Medium | 2-3 weeks |
| **Feature #2**: Expandable Trace UI | Medium | High | 3-4 weeks |
| **Feature #3**: Multi-Test Case Input | Medium | Medium | 2-3 weeks |
| **Feature #4**: API Key Configuration Popup | High | Low | 1-2 weeks |
| **Feature #5**: TDX Log Display | Low-Medium | Medium | 2-3 weeks |

---

## Worktree Setup Strategy

### 1. Repository Structure
```
agent-eval-tool-v1/                    # Main repository (current location)
├── docs/v4-features-plan.md           # Feature specifications
├── docs/v4-worktrees-parallel-dev-plan.md  # This document
└── src/                               # Current codebase

../agent-eval-v4-worktrees/            # Worktree parent directory
├── feature-1-api-performance/         # Feature #1 worktree
├── feature-2-expandable-traces/       # Feature #2 worktree
├── feature-3-multi-test-input/        # Feature #3 worktree
├── feature-4-api-key-popup/           # Feature #4 worktree
├── feature-5-tdx-logs/                # Feature #5 worktree
└── integration/                       # Final integration worktree
```

### 2. Branch Naming Convention
```
feature/v4-api-performance              # Feature #1
feature/v4-expandable-traces            # Feature #2
feature/v4-multi-test-input             # Feature #3
feature/v4-api-key-popup                # Feature #4
feature/v4-tdx-logs                     # Feature #5
feature/v4-integration                  # Integration branch
release/v4.0.0                          # Final release branch
```

---

## Implementation Plan

### Phase 1: Initial Setup (Day 1)

#### Step 1: Create Feature Branches
```bash
# Navigate to main repository
cd /Users/greg.williams/PycharmProjects/agent-eval-tool-v1

# Create feature branches from current main/master
git checkout main  # or master
git pull origin main

# Create all feature branches
git branch feature/v4-api-performance
git branch feature/v4-expandable-traces
git branch feature/v4-multi-test-input
git branch feature/v4-api-key-popup
git branch feature/v4-tdx-logs
git branch feature/v4-integration

# Push branches to origin
git push -u origin feature/v4-api-performance
git push -u origin feature/v4-expandable-traces
git push -u origin feature/v4-multi-test-input
git push -u origin feature/v4-api-key-popup
git push -u origin feature/v4-tdx-logs
git push -u origin feature/v4-integration
```

#### Step 2: Create Worktree Directory Structure
```bash
# Create parent directory for all worktrees
mkdir -p ../agent-eval-v4-worktrees
cd ../agent-eval-v4-worktrees
```

#### Step 3: Setup Individual Worktrees
```bash
# Feature #1: API Performance Optimization
git worktree add -b feature/v4-api-performance feature-1-api-performance

# Feature #2: Expandable Trace UI
git worktree add -b feature/v4-expandable-traces feature-2-expandable-traces

# Feature #3: Multi-Test Case Input
git worktree add -b feature/v4-multi-test-input feature-3-multi-test-input

# Feature #4: API Key Configuration Popup
git worktree add -b feature/v4-api-key-popup feature-4-api-key-popup

# Feature #5: TDX Log Display
git worktree add -b feature/v4-tdx-logs feature-5-tdx-logs

# Integration worktree
git worktree add -b feature/v4-integration integration
```

#### Step 4: Setup Development Environment for Each Worktree
```bash
# Setup script for each worktree
for dir in feature-*-*/; do
    echo "Setting up $dir"
    cd "$dir"

    # Install dependencies
    npm install

    # Copy environment configuration
    cp ../../agent-eval-tool-v1/.env.local.example .env.local

    # Create feature-specific documentation
    mkdir -p docs/development

    cd ..
done
```

### Phase 2: Development Workflow (Weeks 1-4)

#### Development Process for Each Feature

**Daily Workflow:**
```bash
# 1. Navigate to feature worktree
cd ../agent-eval-v4-worktrees/feature-1-api-performance

# 2. Pull latest changes (if collaborating)
git pull origin feature/v4-api-performance

# 3. Develop feature following implementation plan
# 4. Test locally
npm run dev
npm run test

# 5. Commit progress
git add .
git commit -m "feat(api): implement parallel API calls for agent listing

- Add parallel fetch for projects and agents API
- Implement feature flag USE_DIRECT_API
- Add error handling with fallback to TDX CLI
- Performance improvement: 500-1500ms → 100-300ms

Closes: #feature-1-phase-1"

# 6. Push to remote
git push origin feature/v4-api-performance
```

#### Feature-Specific Development Guidelines

**Feature #1: API Performance**
```bash
cd feature-1-api-performance

# Implementation files:
# src/app/api/agents/route.ts           - Replace TDX CLI with API calls
# src/lib/api/llm-client.ts            - New TD LLM API client
# src/components/agent/AgentSelector.tsx - Handle new data structure

# Testing:
# - Performance benchmarks before/after
# - Feature flag testing (API vs CLI)
# - Error handling validation
```

**Feature #2: Expandable Traces**
```bash
cd feature-2-expandable-traces

# Implementation files:
# src/components/traces/TraceCard.tsx           - Expandable cards
# src/components/traces/ToolCallTabs.tsx       - Tabbed interface
# src/components/traces/TraceTimeline.tsx      - Timeline view
# src/hooks/useTraceExpansion.tsx              - State management

# Testing:
# - UI/UX testing with various trace data
# - Performance with large traces
# - Copy-to-clipboard functionality
```

**Feature #3: Multi-Test Case Input**
```bash
cd feature-3-multi-test-input

# Implementation files:
# src/components/testing/TestCaseInputModal.tsx - Modal interface
# src/components/testing/TestCaseForm.tsx       - Form components
# src/hooks/useTestCaseManager.tsx              - State management
# src/utils/testCaseValidation.ts               - Validation logic

# Testing:
# - Form validation edge cases
# - YAML generation accuracy
# - Integration with existing test flow
```

**Feature #4: API Key Configuration**
```bash
cd feature-4-api-key-popup

# Implementation files:
# src/components/setup/ApiKeySetupModal.tsx     - Setup modal
# src/hooks/useSetupDetection.tsx              - Detection logic
# src/app/api/config/env-file/route.ts         - .env.local creation

# Testing:
# - First-time user experience
# - Environment detection
# - .env.local file creation
```

**Feature #5: TDX Logs**
```bash
cd feature-5-tdx-logs

# Implementation files:
# src/components/debug/LogViewer.tsx            - Log display
# src/components/debug/DebugConsole.tsx        - Debug interface
# src/hooks/useDebugMode.tsx                   - Debug state
# src/app/api/logs/stream/route.ts             - Log streaming

# Testing:
# - Progressive disclosure functionality
# - Real-time log streaming
# - User persona-based display
```

### Phase 3: Integration Strategy (Week 5)

#### Step 1: Create Integration Plan
```bash
cd integration

# Create integration checklist
cat > docs/integration-checklist.md << 'EOF'
# V4 Integration Checklist

## Pre-Integration
- [ ] All feature tests passing
- [ ] Code reviews completed
- [ ] Documentation updated
- [ ] Breaking changes documented

## Integration Order
1. [ ] Feature #4 (API Key Popup) - Foundation
2. [ ] Feature #1 (API Performance) - Core functionality
3. [ ] Feature #3 (Multi-Test Input) - User experience
4. [ ] Feature #2 (Expandable Traces) - Advanced features
5. [ ] Feature #5 (TDX Logs) - Debug capabilities

## Post-Integration
- [ ] End-to-end testing
- [ ] Performance benchmarks
- [ ] User acceptance testing
- [ ] Migration guide created
EOF
```

#### Step 2: Sequential Feature Integration
```bash
# Start with integration branch
cd integration
git checkout feature/v4-integration

# Integration Order (based on dependencies):

# 1. Feature #4: API Key Configuration (foundational)
git merge --no-ff feature/v4-api-key-popup
# Test: Verify setup flow works
npm run test:integration

# 2. Feature #1: API Performance (core improvement)
git merge --no-ff feature/v4-api-performance
# Test: Verify API calls work with new setup flow
npm run test:performance

# 3. Feature #3: Multi-Test Input (depends on core functionality)
git merge --no-ff feature/v4-multi-test-input
# Test: Verify test case creation works end-to-end
npm run test:test-cases

# 4. Feature #2: Expandable Traces (UI enhancement)
git merge --no-ff feature/v4-expandable-traces
# Test: Verify trace visualization with all features
npm run test:traces

# 5. Feature #5: TDX Logs (debug enhancement)
git merge --no-ff feature/v4-tdx-logs
# Test: Verify debug mode with complete system
npm run test:debug
```

#### Step 3: Conflict Resolution Strategy
```bash
# For each merge conflict:
# 1. Identify conflict type
cat > docs/conflict-resolution.md << 'EOF'
# Common Conflict Types and Resolutions

## File Conflicts
- package.json: Merge dependencies, keep highest versions
- src/app/page.tsx: Integrate all UI changes
- src/lib/types/: Merge type definitions
- tailwind.config.js: Merge utility classes

## Dependency Conflicts
- Prefer newer versions
- Test compatibility
- Update package-lock.json

## Configuration Conflicts
- .env.local.example: Merge all new variables
- next.config.js: Combine all configurations
- tsconfig.json: Merge path mappings
EOF

# 2. Resolve systematically
git status
# Edit conflicted files
# Test resolution
npm run test
# Commit resolution
git add .
git commit -m "resolve: integrate feature conflicts"
```

### Phase 4: Testing and Validation (Week 6)

#### Comprehensive Testing Strategy
```bash
cd integration

# 1. Unit Testing
npm run test
npm run test:coverage

# 2. Integration Testing
npm run test:integration

# 3. Performance Testing
npm run test:performance

# 4. E2E Testing
npm run test:e2e

# 5. User Acceptance Testing
npm run dev
# Manual testing checklist:
# - First-time user setup flow
# - Agent selection performance
# - Test case creation and execution
# - Trace viewing and interaction
# - Debug mode functionality
```

#### Testing Checklist
```markdown
# V4 Testing Checklist

## Functionality Tests
- [ ] API key setup popup appears for new users
- [ ] Agent/project selection loads 3-5x faster
- [ ] Multi-test case input modal works correctly
- [ ] Trace expansion shows full details
- [ ] Debug mode displays appropriate logs per user type

## Performance Tests
- [ ] Agent listing: <300ms (vs previous 500-1500ms)
- [ ] Large trace files render without lag
- [ ] Multiple test case creation under 2 minutes
- [ ] API key setup completes under 2 minutes

## Compatibility Tests
- [ ] All existing features continue to work
- [ ] Environment variables still override settings
- [ ] TDX CLI fallback works when API fails
- [ ] Works across different browsers
- [ ] Mobile responsive design maintained

## User Experience Tests
- [ ] New users can complete setup without help
- [ ] Technical users can access debug information
- [ ] End users see simplified interface
- [ ] Error messages are helpful and actionable
```

### Phase 5: Release Preparation (Week 7)

#### Create Release Branch
```bash
# Create release branch from integration
git checkout feature/v4-integration
git checkout -b release/v4.0.0

# Final preparations
# Update version numbers
npm version 4.0.0

# Create release documentation
cat > docs/v4-release-notes.md << 'EOF'
# Agent Eval Tool V4.0.0 Release Notes

## 🚀 Major Features

### Performance Improvements
- **3-5x faster agent/project loading** via direct API calls
- Agent selection now takes 100-300ms instead of 500-1500ms

### Enhanced User Experience
- **Automatic API key setup** with guided first-time flow
- **Multi-test case creation** interface for custom test scenarios
- **Expandable trace viewer** with full detail drill-down
- **Progressive debug mode** for technical users

### Developer Experience
- Better error handling and debugging capabilities
- Improved system transparency and logging
- Enhanced trace analysis tools

## 🔄 Migration Guide
[Include migration instructions]

## 🐛 Bug Fixes
[List any bug fixes]

## ⚠️ Breaking Changes
[Document any breaking changes]
EOF
```

---

## Worktree Management Commands

### Useful Commands During Development

```bash
# List all worktrees
git worktree list

# Navigate between worktrees
cd ../agent-eval-v4-worktrees/feature-2-expandable-traces

# Check status across all worktrees
for dir in */; do
    echo "=== $dir ==="
    cd "$dir"
    git status --short
    cd ..
done

# Pull updates across all worktrees
for dir in */; do
    echo "=== Updating $dir ==="
    cd "$dir"
    git pull origin $(git branch --show-current)
    cd ..
done

# Remove completed worktree
git worktree remove feature-1-api-performance
git branch -d feature/v4-api-performance  # if branch no longer needed
```

### Cleanup After Integration

```bash
# After successful integration and release
cd /Users/greg.williams/PycharmProjects/agent-eval-tool-v1

# Remove all feature worktrees
git worktree remove ../agent-eval-v4-worktrees/feature-1-api-performance
git worktree remove ../agent-eval-v4-worktrees/feature-2-expandable-traces
git worktree remove ../agent-eval-v4-worktrees/feature-3-multi-test-input
git worktree remove ../agent-eval-v4-worktrees/feature-4-api-key-popup
git worktree remove ../agent-eval-v4-worktrees/feature-5-tdx-logs
git worktree remove ../agent-eval-v4-worktrees/integration

# Merge release branch to main
git checkout main
git merge --no-ff release/v4.0.0
git push origin main

# Create release tag
git tag -a v4.0.0 -m "Agent Eval Tool V4.0.0 - Major performance and UX improvements"
git push origin v4.0.0

# Clean up feature branches (optional)
git branch -d feature/v4-api-performance
git branch -d feature/v4-expandable-traces
git branch -d feature/v4-multi-test-input
git branch -d feature/v4-api-key-popup
git branch -d feature/v4-tdx-logs
git branch -d feature/v4-integration
git branch -d release/v4.0.0
```

---

## Best Practices and Considerations

### Development Guidelines

1. **Commit Message Convention**
```
feat(scope): brief description

Detailed explanation of changes made, why they were made,
and any additional context needed.

- Bullet points for specific changes
- Reference to feature plan section
- Performance metrics if applicable

Closes: #issue-number
```

2. **Testing Requirements**
- Each feature must have unit tests
- Integration tests for API interactions
- E2E tests for user workflows
- Performance benchmarks where applicable

3. **Code Review Process**
- Create PRs for each feature branch
- Require at least one review before merge
- Run automated tests in CI/CD
- Document any architectural decisions

### Common Challenges and Solutions

#### Challenge 1: Dependency Conflicts
**Solution:** Use exact versions in package.json, test thoroughly during integration

#### Challenge 2: Database Schema Changes
**Solution:** Create migration scripts that work across all features

#### Challenge 3: Environment Configuration
**Solution:** Use feature flags to enable/disable features during integration

#### Challenge 4: Testing Data Consistency
**Solution:** Use shared test fixtures and data generation utilities

### Rollback Strategy

If integration fails:
```bash
# Reset integration branch
git checkout feature/v4-integration
git reset --hard HEAD~1  # Remove last merge

# Fix issues in feature branch
cd ../agent-eval-v4-worktrees/feature-X-name
# Fix issues
git commit -am "fix: resolve integration issue"

# Retry integration
cd ../integration
git merge --no-ff feature/v4-feature-name
```

---

## Timeline Summary

| Week | Phase | Activities |
|------|-------|------------|
| **Week 1** | Setup | Create branches, worktrees, development environment |
| **Week 2-4** | Development | Parallel feature development |
| **Week 5** | Integration | Sequential feature integration, conflict resolution |
| **Week 6** | Testing | Comprehensive testing, bug fixes |
| **Week 7** | Release | Documentation, release preparation, deployment |

**Total Timeline: 7 weeks for complete V4 development and release**

---

## Success Criteria

- [ ] All 5 features implemented according to specifications
- [ ] No regression in existing functionality
- [ ] Performance improvements validated (3-5x faster agent loading)
- [ ] User experience improvements verified through testing
- [ ] Clean integration with minimal conflicts
- [ ] Comprehensive test coverage (>90%)
- [ ] Documentation updated for all new features
- [ ] Release successfully deployed

---

*Document Version: 1.0*
*Created: 2026-02-25*
*Last Updated: 2026-02-25*