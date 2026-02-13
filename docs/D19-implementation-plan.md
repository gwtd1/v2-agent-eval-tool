# Plan: Implement D19 - Display Complete Agent Response

## Objective
Display the **actual agent response** in the UI instead of showing LLM evaluation reasoning.

---

## Root Cause Analysis

### The Problem
The "Agent Response" section shows **LLM judge's evaluation reasoning** (e.g., "Response is exactly 'French'...") instead of the **actual agent output** (e.g., "French").

### Why This Happens
TDX CLI `agent test` output does NOT contain actual agent responses - only:
1. Test name
2. PASS/FAIL status
3. Evaluation reasoning
4. Conversation URL

---

## Two Approaches to Get Actual Agent Response

### Approach 1: TDX Chat Command (Recommended)
Use `tdx chat` to run each test case and capture the actual response.

**How it works:**
```bash
tdx chat --new "<prompt>" --agent "project/agent-name"
```
- Runs the agent with the prompt
- Returns the actual agent response to stdout
- We capture and store this response

**Pros:**
- Gets actual agent response directly
- Simple CLI integration (similar to existing `executeTdxAgentTest`)
- No API research needed - documented at tdx.treasuredata.com

**Cons:**
- Runs agent separately from `tdx agent test`
- Slightly slower (additional call per test case)
- Response may differ slightly from test run (different session)

**Implementation:**
1. Create `executeTdxChat()` in `src/lib/tdx/executor.ts`
2. After parsing test.yml, call `tdx chat --new` for each prompt
3. Store actual response in `agentResponse` field

---

### Approach 2: LLM API Chat History
Use existing TD LLM API to fetch conversation history.

**How it works:**
The codebase already has `getChatHistory()` in `src/lib/llm/evaluator.ts`:
```typescript
GET /api/chats/{chatId}/history
```
If we can extract `chatId` from the TDX conversation URL, we can fetch the conversation.

**URL formats:**
- TDX output: `console-next.us01.treasuredata.com/app/af/.../tc/{thread_id}`
- LLM API: `llm-api.us01.treasuredata.com/api/chats/{chatId}/history`

**Challenge:** The `thread_id` from TDX URL may not match the LLM API `chatId` format.

**Pros:**
- Uses existing API code
- Gets exact conversation from the test run
- No additional agent execution

**Cons:**
- URL/ID mapping uncertain - needs testing
- May require API exploration
- Different systems may use different IDs

---

## Recommended: Approach 1 (TDX Chat)

Approach 1 is more reliable because:
1. `tdx chat` is documented and straightforward
2. No ID mapping uncertainty
3. Guarantees we get a real agent response

---

## Implementation Steps

### Step 1: Add TDX Chat Executor
**File:** `src/lib/tdx/executor.ts`
```typescript
export async function executeTdxChat(
  agentPath: string,
  prompt: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  // Execute: tdx chat --new "<prompt>" --agent "<agentPath>"
}
```

### Step 2: Update Test Route
**File:** `src/app/api/test/route.ts`
- After reading test.yml, for each test case:
  1. Call `executeTdxChat(agentPath, prompt)`
  2. Store stdout as `agentResponse`
- Store chat link from TDX test output

### Step 3: Update Database Schema
**File:** `src/lib/db/schema.ts`
- Add `chat_link TEXT` column to `test_cases` table

### Step 4: Update Types
**File:** `src/lib/types/test-case.ts`
- Add `chatLink: string | null` to TestCase interface

### Step 5: Update Queries
**File:** `src/lib/db/queries.ts`
- Update `createTestCase` to store `chatLink`

### Step 6: Update Parser
**File:** `src/lib/tdx/parser.ts`
- Keep evaluation text as separate field (for LLM judge display)
- Ensure `chatLink` is captured

### Step 7: Update ConversationView
**File:** `src/components/panels/ConversationView.tsx`
- Display actual agent response in "Agent Response" section
- Add "View Full Conversation" link to chatLink
- Keep LLM evaluation in separate section

---

## Updated UI

```
[Prompt]
User prompt text...

[Agent Response]              <- NOW SHOWS ACTUAL RESPONSE
"French"

[View Conversation ↗]         <- Link to TD Console

[LLM Evaluation]
Pass: Response is exactly 'French'...
```

---

## Files Summary

| File | Action |
|------|--------|
| `src/lib/tdx/executor.ts` | MODIFY - Add `executeTdxChat()` function |
| `src/lib/db/schema.ts` | MODIFY - Add `chat_link` column |
| `src/lib/types/test-case.ts` | MODIFY - Add `chatLink` field |
| `src/lib/db/queries.ts` | MODIFY - Handle chatLink in queries |
| `src/lib/tdx/parser.ts` | MODIFY - Ensure chatLink captured |
| `src/app/api/test/route.ts` | MODIFY - Call executeTdxChat, store responses |
| `src/components/panels/ConversationView.tsx` | MODIFY - Display actual response + link |

---

## Verification

1. **Run agent test** and verify:
   - "Agent Response" shows actual agent output (e.g., "French")
   - NOT evaluation reasoning
   - "View Conversation" link works

2. **Test various response types:**
   - Short responses (single word)
   - Long responses (multiple paragraphs)
   - JSON/code responses

3. **Edge cases:**
   - Agent timeout
   - Agent error
   - Empty response

---

## Alternative: Approach 2 Exploration (Optional)

If Approach 1 has issues, try Approach 2:
1. Extract `thread_id` from TDX conversation URL
2. Test if `getChatHistory(thread_id, apiKey)` works
3. If successful, use existing API to fetch conversation