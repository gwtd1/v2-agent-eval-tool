# Project Explorer Plan: View Available Projects via API

## Overview

Create a comprehensive project explorer that uses the TD LLM API to fetch and display all available projects based on the user's API key. This will help users understand their project landscape and debug access issues.

## Goals

1. **Fetch All Projects**: Use the TD LLM API to retrieve complete project list
2. **Display Project Details**: Show project metadata, descriptions, and agent counts
3. **Debug API Access**: Help users understand what they have access to
4. **Enhanced UX**: Improve project selection and navigation

## Implementation Approaches

### Approach 1: Standalone Project Explorer Page
Create a dedicated page for exploring projects and their details.

### Approach 2: Enhanced Project Selector
Improve the existing agent selector with rich project information.

### Approach 3: CLI Tool
Create a command-line tool for quick project inspection.

---

## Detailed Implementation Plan

### Phase 1: API Integration Enhancement

#### 1.1 Enhanced TD LLM Client Methods

**File**: `src/lib/api/llm-client.ts`

Add methods for detailed project exploration:

```typescript
/**
 * Get detailed project information with agent counts
 */
async getProjectsWithDetails(): Promise<ProjectDetails[]> {
  const [projects, agents] = await this.getProjectsAndAgents();

  return projects.map(project => ({
    ...project,
    agentCount: agents.filter(agent => agent.project_id === project.id).length,
    agents: agents.filter(agent => agent.project_id === project.id)
  }));
}

/**
 * Get specific project by ID with full details
 */
async getProjectById(projectId: string): Promise<ProjectDetails | null> {
  // Implementation for fetching specific project
}

/**
 * Test API access and return available endpoints
 */
async getApiCapabilities(): Promise<ApiCapabilities> {
  // Test different endpoints to see what user has access to
}
```

#### 1.2 New Type Definitions

**File**: `src/lib/types/project.ts` (new file)

```typescript
export interface ProjectDetails extends Project {
  agentCount: number;
  agents: Agent[];
  lastModified?: string;
  status?: 'active' | 'inactive';
}

export interface ApiCapabilities {
  canListProjects: boolean;
  canListAgents: boolean;
  canCreateAgents: boolean;
  endpoint: string;
  region: string;
}

export interface ProjectExplorerData {
  projects: ProjectDetails[];
  totalProjects: number;
  totalAgents: number;
  capabilities: ApiCapabilities;
  loadTime: number;
}
```

### Phase 2: User Interface Options

#### Option A: Dedicated Project Explorer Page

**File**: `src/app/projects/page.tsx` (new file)

Features:
- **Project Grid**: Visual cards showing project details
- **Search & Filter**: Find projects by name, description, agent count
- **Project Details**: Expandable sections with agent lists
- **API Status**: Show connection status and capabilities
- **Performance Metrics**: Display API response times

Layout:
```
┌─ Project Explorer ──────────────────────────────────────────┐
│ 🔍 Search: [javascript frameworks    ] 📊 API Status: ✅   │
│ Filters: [All] [Has Agents] [Recent] [Mine]                │
├─────────────────────────────────────────────────────────────┤
│ ┌─ TD-Managed Creative Studio ─────────────────────────────┐ │
│ │ 🎨 Creative content generation and management           │ │
│ │ 📊 12 agents • Updated 2 days ago                       │ │
│ │ [View Agents] [Details]                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Data Processing Pipeline ───────────────────────────────┐ │
│ │ 🔧 ETL and data transformation workflows                │ │
│ │ 📊 8 agents • Updated 1 week ago                        │ │
│ │ [View Agents] [Details]                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Option B: Enhanced Agent Selector

**File**: `src/components/agent/EnhancedAgentSelector.tsx` (new file)

Features:
- **Project Cards**: Rich project information in dropdown
- **Agent Counts**: Show number of agents per project
- **Quick Access**: Recently used projects at top
- **Project Details Modal**: Click to see full project info

#### Option C: Admin Dashboard Widget

**File**: `src/components/admin/ProjectOverview.tsx` (new file)

Features:
- **Stats Summary**: Total projects, agents, API status
- **Recent Activity**: Last modified projects
- **Access Verification**: Test API endpoints
- **Quick Actions**: Navigate to projects, refresh data

### Phase 3: CLI Tool for Developers

#### 3.1 Project Inspector Script

**File**: `scripts/inspect-projects.js` (new file)

```javascript
#!/usr/bin/env node
/**
 * Project Inspector CLI Tool
 * Usage: npm run inspect-projects [options]
 */

const { createTdLlmClient } = require('../src/lib/api/llm-client');

async function inspectProjects() {
  const client = createTdLlmClient();

  console.log('🔍 Inspecting TD LLM Projects...\n');

  const data = await client.getProjectsWithDetails();

  // Display formatted output
  console.table(data.projects.map(p => ({
    Name: p.name,
    ID: p.id,
    Agents: p.agentCount,
    Created: p.created_at?.split('T')[0] || 'Unknown'
  })));

  console.log(`\n📊 Summary: ${data.totalProjects} projects, ${data.totalAgents} total agents`);
}
```

#### 3.2 Package.json Script

```json
{
  "scripts": {
    "inspect-projects": "node scripts/inspect-projects.js",
    "list-projects": "node scripts/inspect-projects.js --format=list"
  }
}
```

### Phase 4: Implementation Steps

#### Step 1: API Client Enhancement
1. Extend TD LLM client with detailed project methods
2. Add comprehensive error handling for different access levels
3. Implement API capability detection
4. Add performance monitoring

#### Step 2: Create Project Explorer API Route
**File**: `src/app/api/projects/route.ts` (new file)

```typescript
export async function GET() {
  try {
    const client = createTdLlmClient();
    const data = await client.getProjectsWithDetails();

    return NextResponse.json({
      ...data,
      timestamp: new Date().toISOString(),
      apiStatus: 'connected'
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      apiStatus: 'error',
      suggestions: [
        'Verify TD_API_KEY is correct',
        'Check TD_LLM_BASE_URL configuration',
        'Ensure API key has project access permissions'
      ]
    }, { status: 500 });
  }
}
```

#### Step 3: Choose UI Implementation
**Recommended**: Start with Enhanced Agent Selector (Option B) for immediate value.

#### Step 4: Add CLI Tool
Implement developer CLI tool for quick project inspection.

### Phase 5: Advanced Features

#### 5.1 Real-time Updates
- **WebSocket Integration**: Live project updates
- **Refresh Button**: Manual refresh with loading states
- **Auto-refresh**: Periodic background updates

#### 5.2 Project Analytics
- **Usage Metrics**: Track which projects are accessed most
- **Performance Monitoring**: API response time trends
- **Access Patterns**: Understand user behavior

#### 5.3 Enhanced Filtering
- **Date Ranges**: Filter by creation/modification date
- **Agent Count**: Filter by number of agents
- **Text Search**: Full-text search in descriptions
- **Tags/Categories**: If available in API

---

## Quick Start Implementation

### Immediate Value: Enhanced Project Display

**File**: `src/app/api/projects/explore/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createTdLlmClient } from '@/lib/api/llm-client';

export async function GET() {
  console.log('[API] GET /api/projects/explore - Fetching detailed project data');
  const startTime = Date.now();

  try {
    const client = createTdLlmClient();
    const { projects, agents } = await client.getProjectsAndAgents();

    // Group agents by project and add counts
    const projectDetails = projects.map(project => ({
      ...project,
      agentCount: agents.filter(agent => agent.project_id === project.id).length,
      agents: agents.filter(agent => agent.project_id === project.id)
    }));

    const duration = Date.now() - startTime;

    return NextResponse.json({
      projects: projectDetails,
      totalProjects: projects.length,
      totalAgents: agents.length,
      performance: { duration_ms: duration },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Project exploration failed after ${duration}ms:`, error);

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      performance: { duration_ms: duration },
      suggestions: [
        'Verify your TD_API_KEY is valid',
        'Check TD_LLM_BASE_URL configuration',
        'Ensure your API key has project listing permissions'
      ]
    }, { status: 500 });
  }
}
```

### Simple Project Explorer Component

**File**: `src/components/projects/ProjectExplorer.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';

interface ProjectDetails {
  id: string;
  name: string;
  description?: string;
  agentCount: number;
  created_at?: string;
}

export function ProjectExplorer() {
  const [projects, setProjects] = useState<ProjectDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects/explore');
        if (!response.ok) throw new Error('Failed to fetch projects');

        const data = await response.json();
        setProjects(data.projects);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  if (loading) {
    return <div className="animate-pulse">Loading projects...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Available Projects ({projects.length})</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map(project => (
          <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <h3 className="font-medium text-lg">{project.name}</h3>
            {project.description && (
              <p className="text-gray-600 text-sm mt-1">{project.description}</p>
            )}
            <div className="mt-2 text-sm text-gray-500">
              📊 {project.agentCount} agents
              {project.created_at && (
                <> • Created {new Date(project.created_at).toLocaleDateString()}</>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Success Metrics

### Technical Metrics
- **API Response Time**: < 500ms for project listing
- **Error Rate**: < 5% for API calls
- **Data Accuracy**: 100% match with actual accessible projects

### User Experience Metrics
- **Discovery Time**: Reduce time to find projects by 50%
- **User Understanding**: Clear visibility into available resources
- **Error Resolution**: Self-service debugging of access issues

### Business Metrics
- **API Usage**: Track which projects are most accessed
- **User Engagement**: Measure project exploration patterns
- **Support Reduction**: Fewer "can't see my projects" tickets

---

## Recommended Implementation Order

1. **Phase 1**: Enhanced API client with project details (30 min)
2. **Phase 2**: Simple project explorer API route (15 min)
3. **Phase 3**: Basic project explorer component (45 min)
4. **Phase 4**: Add to main navigation/dashboard (15 min)
5. **Phase 5**: CLI tool for developers (30 min)

**Total Estimated Time**: ~2.5 hours for complete basic implementation

This will give you immediate visibility into all projects accessible via your API key, with room for future enhancements based on user feedback.