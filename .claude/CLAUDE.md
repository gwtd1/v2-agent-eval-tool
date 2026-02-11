# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Instruction

**NEVER generate code or execute code when the user enters a prompt.**

ONLY generate code or execute code when the user explicitly says "execute".

When the user provides a prompt without saying "execute":
- Discuss the approach
- Ask clarifying questions
- Explain what would need to be done
- Wait for explicit "execute" instruction before writing or running any code

## Project Overview

Agent Eval Tool V1 is a Next.js application for evaluating LLM agent performance using human-in-the-loop evaluation and LLM-as-a-judge methodology. It integrates with TDX (Treasure Data) to manage test cases, execute evaluations, and analyze agent responses against ground truth data.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run lint     # Run ESLint
```

## Tech Stack

- Next.js 14 (App Router)
- React 18 with TypeScript
- Tailwind CSS
- SQLite (better-sqlite3) for local data storage
- TDX CLI integration for agent testing

## Project Structure

- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components
- `src/lib/` - Utilities and database layer
- `src/context/` - React context providers
- `agents/` - Agent configurations
- `data/` - Data files
- `docs/` - Documentation including v2-roadmap.md

## Current Development Focus (V2)

See `docs/v2-roadmap.md` for active development items including:
- Conversation trace display
- LLM-as-a-judge results UI
- Pass/Fail rating system
- TDX execution logs streaming