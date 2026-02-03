# Getting Started: Agent Eval Tool v1

**Document Type**: User Guide
**Status**: Living Document
**Last Updated**: February 2026

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Prerequisites](#2-prerequisites)
3. [Installation](#3-installation)
4. [Configuration](#4-configuration)
5. [Running the Application](#5-running-the-application)
6. [Basic Usage](#6-basic-usage)
7. [Keyboard Shortcuts](#7-keyboard-shortcuts)
8. [Viewing Logs](#8-viewing-logs)
9. [Troubleshooting](#9-troubleshooting)
10. [FAQ](#10-faq)

---

## 1. Quick Start

```bash
# Clone and install
cd agent-eval-tool-v1
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your TD_API_KEY

# Start the app
npm run dev

# Open in browser
open http://localhost:3000
```

---

## 2. Prerequisites

### Required

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Node.js | 20+ | `node --version` |
| npm | 10+ | `npm --version` |
| TDX CLI | Latest | `tdx --version` |

### TDX CLI Installation

If TDX CLI is not installed:

```bash
# Install TDX CLI (check internal docs for latest method)
npm install -g @anthropics/tdx-cli

# Or via internal package manager
# (Consult TD internal documentation)
```

### TDX Authentication

Ensure you have:
- A valid TD API Key (Master Key recommended for testing)
- Access to TDX projects with agents

---

## 3. Installation

### From Repository

```bash
# Navigate to project directory
cd /path/to/agent-eval-tool-v1

# Install dependencies
npm install

# Verify installation
npm run build
```

### Verify Database Setup

```bash
# Test database operations
npx tsx scripts/test-db.ts

# Expected output:
# ✓ Database initialized
# ✓ Created test run: ...
# ✓ All database operations working correctly!
```

---

## 4. Configuration

### Environment Variables

Create `.env.local` in the project root:

```env
# Required: TDX Configuration
TD_API_KEY=your-master-api-key

# Optional: TDX Environment
TD_LLM_BASE_URL=https://llm-api-development.us01.treasuredata.com

# Optional: Default Agent
TD_AGENT_ID=your-default-agent-id

# Optional: Database Location
DATABASE_PATH=./data/evaluations.db

# Optional: App Settings
NODE_ENV=development
```

### TDX Environments

| Environment | LLM API Base URL |
|-------------|------------------|
| Development US | `https://llm-api-development.us01.treasuredata.com` |
| Development EU | `https://llm-api-development.eu01.treasuredata.com` |
| Staging US | `https://llm-api-staging.us01.treasuredata.com` |
| Staging JP | `https://llm-api-staging.treasuredata.co.jp` |

### Verify Configuration

```bash
# Check TDX access
tdx agent list

# If successful, you'll see your available agents
```

---

## 5. Running the Application

### Development Mode

```bash
npm run dev
```

Opens at: http://localhost:3000

Features:
- Hot reload on file changes
- Detailed error messages
- Source maps for debugging

### Production Mode

```bash
npm run build
npm run start
```

Opens at: http://localhost:3000

Features:
- Optimized for performance
- Minified assets

---

## 6. Basic Usage

### Step 1: Select an Agent

1. Open http://localhost:3000
2. Select a **Project** from the dropdown
3. Select an **Agent** from the filtered list
4. Click **Run Test**

### Step 2: Wait for Test Execution

- A loading indicator shows while TDX executes the agent tests
- This may take 1-5 minutes depending on the number of test cases
- You'll be automatically redirected to the review interface

### Step 3: Review Test Cases

The review interface has three panels:

```
┌──────────────┬─────────────────────────┬──────────────────┐
│  Test Cases  │   Conversation View     │   Evaluation     │
│              │                         │                  │
│  • TC-001    │  Human: [prompt]        │  ○ Good  ○ Bad   │
│  • TC-002 ●  │                         │                  │
│  • TC-003    │  AI: [response]         │  Notes:          │
│  • TC-004    │                         │  [____________]  │
│              │  Ground Truth: [value]  │                  │
│              │                         │  [Back] [Next]   │
└──────────────┴─────────────────────────┴──────────────────┘
```

### Step 4: Rate Each Test Case

1. **Read** the prompt and agent response
2. **Compare** against ground truth (if available)
3. **Rate** as Good or Bad
4. **Add notes** explaining your rating (required for Bad)
5. Click **Next** or press → to continue

### Step 5: Export Results

1. Complete all reviews (or as many as needed)
2. Click **Export** button
3. Choose CSV or JSON format
4. File downloads to your computer

---

## 7. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| → or J | Next test case |
| ← or K | Previous test case |
| G | Rate as Good |
| B | Rate as Bad |
| N | Focus notes field |
| Esc | Exit notes, return to navigation |

**Tip**: Keyboard shortcuts are disabled while typing in the notes field.

---

## 8. Viewing Logs

### Development Mode

When running `npm run dev`, all console logs are displayed in the terminal where you started the server.

**Log Prefixes**:
- `[TDX]` - TDX CLI command execution logs
- `[API]` - API route handler logs

**Example Output**:
```
[TDX] Executing: tdx agent list --format json
[TDX] Completed in 1234ms, exit code: 0
[API] GET /api/agents - Fetching agent list
[API] Found 5 agents
```

### Browser Console

Client-side logs appear in your browser's DevTools console:
1. Open DevTools (Cmd+Option+I on Mac, F12 on Windows)
2. Go to the "Console" tab
3. Look for React component logs and API response logs

### Log Levels

| Level | Purpose | Example |
|-------|---------|---------|
| `console.log` | General info | Command execution, API requests |
| `console.warn` | Warnings | stderr output from commands |
| `console.error` | Errors | Failed commands, exceptions |

---

## 9. Troubleshooting

### Issue: "TDX CLI not available"

**Cause**: TDX CLI is not installed or not in PATH

**Solution**:
```bash
# Verify TDX is installed
which tdx

# If not found, install TDX CLI
# (See Prerequisites section)

# Verify it works
tdx --version
```

### Issue: "Authentication failed"

**Cause**: Invalid or missing API key

**Solution**:
1. Check `.env.local` has correct `TD_API_KEY`
2. Verify the key is valid: `tdx agent list`
3. Ensure the key has access to the project

### Issue: "No agents found"

**Cause**: No agents in the project or wrong project selected

**Solution**:
1. Verify agents exist: `tdx agent list`
2. Check you have access to the project
3. Try a different project

### Issue: "No test file found"

**Cause**: The agent doesn't have an `agent.yaml` with test cases

**Solution**:
1. Create test cases using TDX:
   ```bash
   tdx agent test-init "project/agent-name"
   ```
2. Add test cases to `agent.yaml`
3. Re-run the test

### Issue: Database errors

**Cause**: Corrupted database or permission issues

**Solution**:
```bash
# Remove existing database
rm data/evaluations.db data/evaluations.db-*

# Restart the app (recreates database)
npm run dev
```

### Issue: App won't start

**Cause**: Various possible issues

**Solution**:
```bash
# Clear node modules and reinstall
rm -rf node_modules
npm install

# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build

# Start again
npm run dev
```

---

## 10. FAQ

### Q: Where is my data stored?

**A**: All evaluations are stored in a local SQLite database at `data/evaluations.db`. This file persists between sessions.

### Q: Can I run multiple test runs?

**A**: Yes. Each test run is stored separately. Currently, V1 shows the most recent run. Historical comparison is planned for V2.

### Q: What if ground truth is empty?

**A**: The app handles this gracefully and displays "Not available". You can still rate based on the quality of the response.

### Q: Can I change a rating after submitting?

**A**: Yes. You can change between Good and Bad at any time. However, you cannot clear a rating back to unrated.

### Q: How do I back up my evaluations?

**A**: Simply copy the `data/evaluations.db` file. To restore, copy it back.

### Q: Can multiple people use this?

**A**: V1 is single-user. Multi-user support is planned for V2.

### Q: What happens if the test takes too long?

**A**: Tests have a 5-minute timeout. If your agent is slower, contact the development team to adjust the timeout.

---

## Updates Log

| Date | Change |
|------|--------|
| 2026-02-02 | Initial document created |
| | |
| | |

---

## Getting Help

- **Technical Issues**: Check the [Troubleshooting](#8-troubleshooting) section
- **Bug Reports**: File an issue in the project repository
- **Feature Requests**: Add to the project backlog
- **Questions**: Contact the development team

---

*This document will be updated as new features are added and common questions arise.*
