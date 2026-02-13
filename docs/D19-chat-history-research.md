# D19 Research Report: Chat History API Options

## Summary

**Conclusion: Approach 3 (TDX LLM History) is the recommended solution.**

Three approaches were tested for fetching agent responses from conversation history:

| Approach | Method | Status |
|----------|--------|--------|
| Approach 1 | `tdx chat` command | Viable but creates new session |
| Approach 2 | LLM API `/chats/{id}/history` | Blocked by environment mismatch |
| **Approach 3** | **`tdx llm history` command** | **✓ RECOMMENDED - Works perfectly** |

Approach 3 uses TDX's built-in `tdx llm history` command which handles authentication automatically and returns the exact conversation from the test run.

---

## Test Results

### Test 1: LLM API Chat History (DEV Environment)

Created a chat in DEV and fetched history successfully:

```bash
# Create chat
curl -X POST "https://llm-api-development.us01.treasuredata.com/api/chats" \
  -H "Authorization: TD1 {DEV_API_KEY}" \
  -H "Content-Type: application/vnd.api+json" \
  -d '{"data":{"type":"chats","attributes":{"agentId":"019ae82f-b843-79f5-95c6-c7968262b2c2"}}}'

# Response: {"data":{"id":"019c4f2d-0b01-778b-8562-8d6c65c36753",...}}

# Send message
curl -X POST ".../chats/019c4f2d-0b01-778b-8562-8d6c65c36753/continue" \
  -d '{"input":"Hello, what is 2+2?"}'

# Fetch history
curl "https://llm-api-development.us01.treasuredata.com/api/chats/019c4f2d-0b01-778b-8562-8d6c65c36753/history"

# Response:
{"data":[
  {"input":"Hello, what is 2+2?","at":"2026-02-12T00:08:09Z"},
  {"content":"2 + 2 = **4**","at":"2026-02-12T00:08:09Z"}
]}
```

**Result: SUCCESS** - The API returns user input and agent response.

---

### Test 2: Fetch TDX Conversation History

TDX agent test produces conversation URLs:
```
https://console-next.us01.treasuredata.com/app/af/.../tc/019c4f29-04ab-79d8-8573-a9dfbf11f3b1
```

Attempted to fetch using the thread_id `019c4f29-04ab-79d8-8573-a9dfbf11f3b1`:

| Environment | Endpoint | Result |
|-------------|----------|--------|
| DEV | `llm-api-development.us01.treasuredata.com` | `404 Not Found` |
| STAGING | `llm-api-staging.us01.treasuredata.com` | `401 Unauthorized` |
| PROD | `llm-api.us01.treasuredata.com` | `401 Unauthorized` |

**Analysis:**
- DEV returned 404 because the conversation doesn't exist in DEV
- STAGING/PROD returned 401 because the DEV API key is not valid for those environments
- TDX is configured for `site: us01` (production), creating conversations in PROD

---

## Key Findings

### 1. API Endpoint Works
The `/chats/{chatId}/history` endpoint successfully returns conversation history:
```json
{
  "data": [
    {"input": "user message", "at": "timestamp"},
    {"content": "agent response", "at": "timestamp"}
  ]
}
```

### 2. ID Format is Compatible
- TDX console URL thread_id: `019c4f29-04ab-79d8-8573-a9dfbf11f3b1`
- LLM API chatId: `019c4f2d-0b01-778b-8562-8d6c65c36753`
- Both use the same UUID format

### 3. Environment Mismatch
| Component | Environment |
|-----------|-------------|
| TDX CLI | Production (us01) |
| .env.local API key | Development |
| LLM API base URL | Development |

The configured `TD_LLM_BASE_URL` points to development, but TDX creates conversations in production.

---

### Test 3: TDX LLM History Command (NEW)

Discovered `tdx llm history` command that fetches chat history using TDX's built-in authentication.

**Command syntax:**
```bash
tdx llm history [chat-id]        # Fetch specific chat history
tdx llm history --last           # Fetch most recent chat
tdx llm history                  # Interactive session picker
tdx llm history <chat-id> --json # JSON output for parsing
```

**Test with TDX conversation thread_id:**
```bash
$ tdx llm history 019c4f29-04ab-79d8-8573-a9dfbf11f3b1

- Fetching chat history for '019c4f29-04ab-79d8-8573-a9dfbf11f3b1'...
2026-02-12T00:03:34Z [input]  : Bonjour, comment allez-vous?
2026-02-12T00:03:34Z [content]: French
```

**JSON output:**
```bash
$ tdx llm history 019c4f29-04ab-79d8-8573-a9dfbf11f3b1 --json

[
  {"input":"Bonjour, comment allez-vous?","at":"2026-02-12T00:03:34Z"},
  {"content":"French","at":"2026-02-12T00:03:34Z"}
]
```

**Result: SUCCESS** - Returns exact conversation from the test run with no credential issues.

**Additional test (Japanese prompt):**
```bash
$ tdx llm history 019c4f29-aa57-7a88-8ab4-f2678d48199c --json

[
  {"input":"こんにちは、お元気ですか？","at":"2026-02-12T00:04:16Z"},
  {"content":"Japanese","at":"2026-02-12T00:04:16Z"}
]
```

---

## Response Structure

Chat history API returns:
```typescript
interface ChatHistoryResponse {
  data: {
    input?: string;   // User message (present if user turn)
    content?: string; // Agent response (present if agent turn)
    at: string;       // ISO timestamp
  }[];
}
```

---

## Requirements for Approach 2 to Work

### Option A: Match TDX to API Environment
Configure TDX to use the development environment:
```bash
tdx profile set site=dev  # or similar
```

### Option B: Use Production API Key
Update `.env.local` with production credentials:
```bash
TD_API_KEY=<production_api_key>
TD_LLM_BASE_URL=https://llm-api.us01.treasuredata.com
```

### Option C: Extract API Key from TDX
If TDX stores credentials, extract and use them for LLM API calls.

---

## Implementation Steps (if proceeding with Approach 2)

1. **Extract thread_id from TDX conversation URL**
   ```typescript
   const url = "https://console-next.../tc/019c4f29-04ab-79d8-8573-a9dfbf11f3b1";
   const threadId = url.split('/tc/')[1];
   ```

2. **Call existing `getChatHistory()` function**
   ```typescript
   const history = await getChatHistory(threadId, apiKey);
   const response = history.data.find(m => m.content)?.content;
   ```

3. **Ensure environment alignment**
   - TDX and LLM API must use same environment
   - API key must be valid for that environment

---

## Comparison: All Approaches

| Aspect | Approach 1 (TDX Chat) | Approach 2 (LLM API) | Approach 3 (TDX LLM History) |
|--------|----------------------|----------------------|------------------------------|
| Reliability | High | High | **High** |
| Implementation | Create `executeTdxChat()` | Use `getChatHistory()` | Create `executeTdxHistory()` |
| Session consistency | Different session | Same session | **Same session** |
| Dependencies | TDX CLI | LLM API + credentials | **TDX CLI only** |
| Current blocker | None | Environment mismatch | **None** |
| Output format | Text (needs parsing) | JSON | **JSON (`--json` flag)** |
| Authentication | TDX keychain | API key required | **TDX keychain (automatic)** |

---

## Recommendation

**Use Approach 3 (TDX LLM History)** - Best of both worlds:
- ✓ Uses TDX CLI (already integrated)
- ✓ Returns exact conversation from test run (same session)
- ✓ No credential configuration needed (uses TDX keychain)
- ✓ JSON output for easy parsing
- ✓ Same response structure as LLM API

---

## Approach 3: Implementation Steps

1. **Extract thread_id from TDX conversation URL**
   ```typescript
   // URL: https://console-next.../tc/019c4f29-04ab-79d8-8573-a9dfbf11f3b1
   const threadId = conversationUrl.split('/tc/')[1];
   ```

2. **Execute TDX LLM History command**
   ```typescript
   async function executeTdxLlmHistory(chatId: string): Promise<ChatHistoryEntry[]> {
     const { stdout } = await exec(`tdx llm history ${chatId} --json`);
     return JSON.parse(stdout);
   }
   ```

3. **Extract agent response**
   ```typescript
   const history = await executeTdxLlmHistory(threadId);
   const agentResponse = history.find(entry => entry.content)?.content;
   ```

4. **Integration with existing flow**
   - After `tdx agent test` completes, extract conversation URL
   - Call `tdx llm history <thread_id> --json`
   - Parse JSON and store `content` field as agent response

---

## Why Approach 3 is Better

### vs Approach 1 (TDX Chat)
- Approach 1 creates a **new session** with `tdx chat --new`
- Approach 3 retrieves the **exact conversation** from the test run
- Response may differ between sessions (non-deterministic LLMs)

### vs Approach 2 (LLM API)
- Approach 2 requires matching API credentials for each environment
- Approach 3 uses TDX's existing authentication (keychain)
- No environment configuration needed

---

## API Reference

### TDX CLI Commands (Approach 3)

| Command | Purpose |
|---------|---------|
| `tdx llm history` | Interactive session picker |
| `tdx llm history <chat-id>` | Fetch specific chat history |
| `tdx llm history <chat-id> --json` | JSON output for parsing |
| `tdx llm history --last` | Fetch most recent chat |

**Documentation:** https://tdx.treasuredata.com/commands/llm.html

### LLM API Endpoints (Approach 2)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/chats` | Create new chat |
| POST | `/api/chats/{id}/continue` | Send message |
| GET | `/api/chats/{id}/history` | Fetch conversation history |

### Environment URLs

| Environment | LLM API | Console |
|-------------|---------|---------|
| Development | `llm-api-development.us01.treasuredata.com` | `llm-development.us01.treasuredata.com` |
| Staging | `llm-api-staging.us01.treasuredata.com` | `llm-staging.us01.treasuredata.com` |
| Production | `llm-api.us01.treasuredata.com` | `console-next.us01.treasuredata.com` |

---

## Response Structure (Both Approaches)

Both `tdx llm history --json` and LLM API `/chats/{id}/history` return the same structure:

```typescript
interface ChatHistoryEntry {
  input?: string;   // User message (present if user turn)
  content?: string; // Agent response (present if agent turn)
  at: string;       // ISO timestamp
}

// Response is an array of entries
type ChatHistory = ChatHistoryEntry[];
```

**Example:**
```json
[
  {"input": "Bonjour, comment allez-vous?", "at": "2026-02-12T00:03:34Z"},
  {"content": "French", "at": "2026-02-12T00:03:34Z"}
]
```

---

*Report generated: 2026-02-11*
*Updated: 2026-02-11 (Added Approach 3)*
*Branch: d19-research*
