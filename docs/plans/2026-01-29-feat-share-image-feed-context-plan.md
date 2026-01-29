---
title: "feat: Share Image with Feed Context"
type: feat
date: 2026-01-29
brainstorm: docs/brainstorms/2026-01-29-share-image-feed-context-brainstorm.md
---

# Share Image with Feed Context

Show the user's minted message **in context of the live feed** rather than isolated. User's message highlighted at full brightness; surrounding messages dimmed. Conveys community belonging + identity expression.

## Overview

**Current state:** Share image shows single message in isolation—feels disconnected.

**Target state:** Share image shows 3-5 real messages from the feed with user's message prominently highlighted among them.

## Technical Approach

### Data Fetching Strategy

**Problem:** Contract has no `getSurroundingMessages(tokenId)` function.

**Solution:** Parallel `getMessage()` calls for sequential IDs around target.

```typescript
// For tokenId N, fetch messages N-2, N-1, N, N+1
const ids = [tokenId - 2, tokenId - 1, tokenId, tokenId + 1].filter(id => id >= 1);

const messages = await Promise.all(
  ids.map(id =>
    client.readContract({
      address: CONTRACT_ADDRESS,
      abi: PUBLIC_TERMINAL_ABI,
      functionName: "getMessage",
      args: [BigInt(id)],
    }).catch(() => null) // Handle non-existent IDs gracefully
  )
);

const validMessages = messages.filter(Boolean);
```

### Edge Cases

| Case | Handling |
|------|----------|
| tokenId = 1 | Only fetch messages after (1, 2, 3) |
| tokenId = latest | Only fetch messages before |
| Contract call fails | Skip that message, render with fewer |
| All calls fail | Fall back to isolated message view |

## Implementation Tasks

### 1. Update OG Image Endpoint

**File:** `src/app/api/opengraph-image/mint/route.tsx`

- [ ] Add function `fetchSurroundingMessages(tokenId: string, count: number)`
- [ ] Parallel `getMessage()` calls with error handling
- [ ] Filter nulls, sort by ID ascending
- [ ] Identify which message is the "highlighted" one

### 2. New Feed-Style Layout

**File:** `src/app/api/opengraph-image/mint/route.tsx`

- [ ] Render messages in feed format (ID, timestamp, username, text)
- [ ] Apply 40-50% opacity to non-highlighted messages
- [ ] Full brightness + optional left border for highlighted message
- [ ] Header: "PUBLIC_TERMINAL" + "#X of Y"

```tsx
// Dimmed message style
<div style={{ display: "flex", opacity: 0.4, ... }}>

// Highlighted message style
<div style={{
  display: "flex",
  opacity: 1,
  borderLeft: "3px solid #00FF00",
  paddingLeft: "12px",
  ...
}}>
```

### 3. Update Query Params

**Files:**
- `src/components/App.tsx` (preview image URL)
- `src/app/share/[fid]/page.tsx` (OG image URL construction)

Current params: `tokenId, username, text, color, timestamp, total`

No new params needed—endpoint fetches surrounding messages based on `tokenId`.

### 4. Handle Edge Cases in Rendering

- [ ] If only 1-2 messages available, render smaller feed
- [ ] If fetch fails entirely, fall back to current isolated message view
- [ ] Add timeout (3s) to prevent slow image generation

## Visual Spec

```
┌─────────────────────────────────────────────────────┐
│ PUBLIC_TERMINAL                      #47 of 523    │
├─────────────────────────────────────────────────────┤
│ #45 [2026.01.29 14:22]                             │  ← 40% opacity
│ <alice> previous message here...                   │
├─────────────────────────────────────────────────────┤
│ #46 [2026.01.29 14:25]                             │  ← 40% opacity
│ <bob> another message...                           │
├─────────────────────────────────────────────────────┤
│▌#47 [2026.01.29 14:30]                             │  ← FULL brightness
│▌<username> YOUR MESSAGE HERE                       │     + left border
├─────────────────────────────────────────────────────┤
│ #48 [2026.01.29 14:35]                             │  ← 40% opacity
│ <eve> message after yours...                       │
└─────────────────────────────────────────────────────┘
```

## Acceptance Criteria

- [ ] Share image shows user's message with 2-3 surrounding real messages
- [ ] User's message is clearly highlighted (full brightness, optional border)
- [ ] Other messages visibly dimmed but readable
- [ ] Works for edge cases (first message, latest message)
- [ ] Falls back gracefully if contract calls fail
- [ ] Image generates in <3 seconds

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/api/opengraph-image/mint/route.tsx` | Add surrounding message fetch + new layout |
| `src/components/App.tsx` | Update preview image URL (if needed) |
| `src/app/share/[fid]/page.tsx` | No changes needed (already passes tokenId) |

## Testing

1. **Debug mode:** Ctrl+Shift+D → check preview image shows feed context
2. **Edge cases:** Test with tokenId=1, tokenId=latest
3. **Failure mode:** Disconnect network → verify fallback
4. **Direct URL:** `/api/opengraph-image/mint?tokenId=42` → verify feed renders

## References

- Brainstorm: `docs/brainstorms/2026-01-29-share-image-feed-context-brainstorm.md`
- Current OG endpoint: `src/app/api/opengraph-image/mint/route.tsx`
- Contract ABI: `src/lib/contractABI.ts`
