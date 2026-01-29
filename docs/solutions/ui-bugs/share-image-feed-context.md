---
title: "Share Image Feed Context - Isolated Messages Don't Motivate Sharing"
date: 2026-01-29
problem_type: ui-bugs
severity: medium
status: resolved
component: opengraph-image
modules:
  - src/app/api/opengraph-image/mint/route.tsx
  - src/app/share/[fid]/page.tsx
  - src/components/App.tsx
tags:
  - share
  - og-image
  - feed-context
  - social-virality
  - contract-interaction
  - user-motivation
---

# Share Image Feed Context

## Problem

Share images for PUBLIC_TERMINAL showed single messages in isolation. This felt disconnected and didn't motivate users to share because it lacked the "community belonging" aspect.

**Symptoms:**
- OG image showed only the user's message, no surrounding context
- Share previews felt empty and uncompelling
- Users weren't motivated to share their transmissions

## Root Cause

The OG image endpoint (`/api/opengraph-image/mint`) only rendered the target message without fetching surrounding messages from the contract. Users couldn't see their message as part of an active feed.

## Solution

Show the user's message **in context of the live feed** with surrounding messages dimmed.

### Key Changes

**1. Fetch surrounding messages using multicall**

```typescript
const targetId = BigInt(tokenId);
const ids = [targetId - 1n, targetId, targetId + 1n].filter(id => id >= 1n);

const results = await client.multicall({
  contracts: ids.map(id => ({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PUBLIC_TERMINAL_ABI,
    functionName: "getMessage" as const,
    args: [id],
  })),
  allowFailure: true,
});
```

**2. Render with visual hierarchy**

- **Highlighted message:** Full brightness, cyan metadata, green left border
- **Surrounding messages:** 50% opacity, gray metadata

```typescript
<div style={{
  opacity: isHighlighted ? 1 : 0.5,
  borderLeft: isHighlighted ? "3px solid #00FF00" : "3px solid transparent",
}}>
```

**3. Simplified share URL**

Only pass `tokenId` and `total` - endpoint fetches everything else from contract:
```
/api/opengraph-image/mint?tokenId=42&total=100
```

### Files Modified

| File | Changes |
|------|---------|
| `src/app/api/opengraph-image/mint/route.tsx` | Rewrote to fetch feed context, render with highlighting |
| `src/components/App.tsx` | Simplified preview URL to just tokenId + total |
| `src/app/share/[fid]/page.tsx` | Simplified OG params |

## Visual Result

```
┌─────────────────────────────────────────────────────┐
│ Public_Terminal                      #42 of 100    │
├─────────────────────────────────────────────────────┤
│ #41 [2026.01.29 14:22]                (50% opacity)│
│ <alice> previous message here...                   │
├─────────────────────────────────────────────────────┤
│▌#42 [2026.01.29 14:30]               (HIGHLIGHTED) │
│▌<username> YOUR MESSAGE HERE                       │
├─────────────────────────────────────────────────────┤
│ #43 [2026.01.29 14:35]                (50% opacity)│
│ <bob> next message...                              │
└─────────────────────────────────────────────────────┘
```

## Edge Cases Handled

| Case | Handling |
|------|----------|
| tokenId = 1 | No previous message, show 2 messages (1, 2) |
| tokenId = latest | No next message, show 2 messages |
| Contract call fails | Skip that message, render with fewer |
| All calls fail | Fall back to generic promotional image |

## Prevention

1. **Test share images with real data** - Don't just test with mock data; use actual contract state
2. **Consider social motivation** - Share images should answer "why would someone show this to others?"
3. **Show context** - Isolated content is less compelling than content in context
4. **Use multicall for parallel fetches** - Single RPC call instead of multiple sequential calls

## Testing

```bash
# Test feed context with existing message
curl "http://localhost:3000/api/opengraph-image/mint?tokenId=1&total=2"

# Debug mode in app
# Press Ctrl+Shift+D to simulate successful mint
```

## Related

- Brainstorm: `docs/brainstorms/2026-01-29-share-image-feed-context-brainstorm.md`
- Plan: `docs/plans/2026-01-29-feat-share-image-feed-context-plan.md`
