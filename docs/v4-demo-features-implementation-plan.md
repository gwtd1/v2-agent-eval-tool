# V4 Demo Features Implementation Plan
## Agent Eval Tool - v4-roadmap Branch

### Overview
This document outlines the implementation plan for V4 features with "Demo" status that need to be integrated into the v4-roadmap branch. These features have been implemented elsewhere but require adaptation and integration into the current application architecture.

### Target Features (Status: Demo)
- **D27**: TDX Project Selector Dropdown
- **D28**: Filesystem-safe path handling
- **D28b**: TDX_PROJECT env var support
- **D28c**: Fix JSON parsing for mixed TDX output
- **D29**: TDX built-in evaluation integration

---

## Current Application Analysis

### Architecture Overview
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with React 18
- **Database**: SQLite (better-sqlite3)
- **Integration**: TDX CLI for agent testing
- **Key Directories**:
  - `src/app/` - Next.js pages and API routes
  - `src/components/` - React components
  - `src/lib/` - Utilities and database layer
  - `src/lib/tdx/` - TDX integration layer
  - `agents/` - Agent configurations

### Key Files to Modify
1. **TDX Integration Layer**:
   - `src/lib/tdx/executor.ts` - TDX command execution
   - `src/lib/tdx/parser.ts` - TDX output parsing
   - `src/lib/tdx/types.ts` - TypeScript interfaces

2. **API Routes**:
   - `src/app/api/test/route.ts` - Test execution endpoint
   - `src/app/api/agents/route.ts` - Agent listing endpoint
   - New: `src/app/api/projects/route.ts` - Project listing
   - New: `src/app/api/project-context/route.ts` - Project context management

3. **Frontend Components**:
   - Landing page component (agent selector area)
   - Project selector dropdown component

---

## Implementation Strategy

### Phase 1: Backend Infrastructure (D28, D28b, D28c)
**Goal**: Establish robust TDX integration foundation

#### Step 1.1: Filesystem-safe Path Handling (D28)
**Files**: `src/lib/tdx/executor.ts`, `src/lib/tdx/parser.ts`

**Implementation**:
1. Add helper function `toFilesystemSafeName()` in executor.ts
2. Update `executeTdxAgentTest()` to use safe names for local paths
3. Update `initTdxAgentTest()` for agent directory paths
4. Add `toFilesystemSafePath()` helper in parser.ts
5. Update `readTestYamlForAgent()` to use safe paths

**Key Principle**: Use original names (with colons) for TDX CLI commands, safe names (underscores) for filesystem operations.

#### Step 1.2: Environment Variable Support (D28b)
**Files**: `src/lib/tdx/executor.ts`, `src/lib/tdx/parser.ts`, `.env.example`

**Implementation**:
1. Add `TDX_PROJECT` to `.env.example`
2. Update `listTdxAgents()` to check `process.env.TDX_PROJECT`
3. Update `parseAgentArray()` to use TDX_PROJECT as default
4. Update `parseAgentPath()` to fall back to env variable
5. Modify `extractProjectFromPath()` to allow fallback

#### Step 1.3: JSON Output Parsing (D28c)
**Files**: `src/lib/tdx/parser.ts`

**Implementation**:
1. Update `parseAgentListOutput()` to handle mixed output
2. Add regex extraction: `/\[[\s\S]*\]/` to find JSON array
3. Implement fallback parsing for text output when JSON extraction fails
4. Test with both pure JSON and mixed status+JSON output

### Phase 2: TDX Evaluation Integration (D29)
**Goal**: Replace external LLM API with TDX built-in evaluation

#### Step 2.1: Data Structure Updates
**Files**: `src/lib/tdx/parser.ts`

**Implementation**:
1. Add `tdxEvaluation?: string` to `ParsedTestCase` interface
2. Update `saveCase()` in `extractTestCasesFromOutput()` to capture evaluation text
3. Extract evaluation reasoning from `✓ PASS:` and `✗ FAIL:` lines

#### Step 2.2: API Route Modification
**Files**: `src/app/api/test/route.ts`

**Implementation**:
1. Remove import for external `evaluateWithLlm` function
2. Replace LLM evaluation loop with TDX evaluation processing
3. Map TDX PASS/FAIL results to app's evaluation format
4. Set `evaluatorAgentId: 'tdx-builtin'` to indicate source

**Benefits**:
- Eliminates need for separate LLM API credentials
- Faster evaluation (no additional API calls)
- Consistent with TDX execution context

### Phase 3: Project Management API (D27 Prerequisites)
**Goal**: Create backend APIs for project management

#### Step 3.1: Project Context API
**Files**: `src/app/api/project-context/route.ts` (new)

**Implementation**:
1. **GET** endpoint: Return current project from session/memory
2. **POST** endpoint: Set project context for user session
3. Use in-memory store or session cookies for persistence
4. Integration with `listTdxAgents()` to respect context

#### Step 3.2: Project List API
**Files**: `src/app/api/projects/route.ts` (new)

**Implementation**:
1. Execute `tdx llm projects` command
2. Parse output to extract project names and types
3. Return structured JSON with available projects
4. Include current project indicator

### Phase 4: Project Selector UI (D27)
**Goal**: Add project dropdown to frontend

#### Step 4.1: Project Selector Component
**Files**: New component file, landing page integration

**Implementation**:
1. Create project dropdown component above agent selector
2. Fetch projects from `/api/projects` endpoint
3. Handle project selection and context switching
4. Show loading states during project operations
5. Refresh agent list after project change

#### Step 4.2: User Experience Flow
**Workflow**:
1. User opens landing page
2. Project dropdown shows all TDX projects
3. User selects project → triggers context switch
4. Agent dropdown refreshes with project-specific agents
5. Normal evaluation flow continues

---

## Implementation Dependencies

### Critical Path
1. **D28** → **D28b** → **D28c** (Foundation for TDX integration)
2. **D28c** → **D29** (JSON parsing needed for evaluation extraction)
3. **D28b** → **Project APIs** → **D27** (Env support enables project switching)

### Feature Interdependencies
- **D28** is required for **D27** to work with special characters in project names
- **D28b** enables **D27** project switching functionality
- **D28c** is needed for reliable project/agent listing
- **D29** can be implemented independently once **D28c** is complete

---

## Testing Strategy

### Unit Tests
1. **Path conversion functions**: Test colon-to-underscore conversion
2. **JSON parsing**: Test mixed output extraction with various TDX formats
3. **Environment variable handling**: Test fallback behavior

### Integration Tests
1. **Project switching**: End-to-end project selection and agent listing
2. **TDX evaluation**: Verify PASS/FAIL parsing and storage
3. **File path resolution**: Test agent file access with special characters

### Manual Testing Scenarios
1. Switch between projects with special characters (colons, spaces)
2. Run evaluations and verify TDX evaluation results appear correctly
3. Test with mixed TDX output (status messages + JSON)
4. Verify agent file access across different project contexts

---

## Implementation Timeline

### Week 1: Foundation (D28, D28b, D28c)
- Days 1-2: Filesystem-safe path handling (D28)
- Days 3-4: Environment variable support (D28b)
- Days 5: JSON parsing fixes (D28c)

### Week 2: Evaluation & APIs (D29, Project APIs)
- Days 1-3: TDX evaluation integration (D29)
- Days 4-5: Project management APIs

### Week 3: Frontend Integration (D27)
- Days 1-3: Project selector component
- Days 4-5: Integration testing and refinement

---

## Risk Mitigation

### Technical Risks
1. **TDX CLI behavior changes**: Implement robust error handling and fallbacks
2. **Special character edge cases**: Comprehensive testing with various project names
3. **Session management**: Plan for multi-user/multi-tab scenarios

### Implementation Risks
1. **Breaking existing functionality**: Implement with backward compatibility
2. **Environment dependencies**: Clear documentation for required setup
3. **Performance impact**: Monitor API response times with project switching

---

## Success Criteria

### Functionality
- ✅ Users can switch TDX projects from UI without CLI commands
- ✅ File paths work correctly with special characters in project names
- ✅ TDX evaluation results display instead of external LLM calls
- ✅ Project context persists within user session

### Quality
- ✅ All existing tests continue to pass
- ✅ New functionality has comprehensive test coverage
- ✅ Error handling for edge cases (missing projects, TDX failures)
- ✅ Clear user feedback during project operations

### User Experience
- ✅ Intuitive project selection workflow
- ✅ Fast project switching with loading indicators
- ✅ Reliable agent listing across all projects
- ✅ Consistent evaluation results display

---

## Next Steps

1. **Review and Approve Plan**: Validate technical approach and timeline
2. **Environment Setup**: Ensure development environment supports all features
3. **Implementation Begin**: Start with Phase 1 (D28) and work through dependencies
4. **Continuous Testing**: Test each feature as implemented to catch issues early
5. **Documentation Updates**: Update README and API docs as features are added