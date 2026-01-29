# Share Image: Feed Context Design

**Date:** 2026-01-29
**Status:** Ready for planning

## What We're Building

A redesigned share image (OG image) that shows the user's minted message **in the context of the live feed**, rather than isolated. The goal is to make sharing feel compelling by conveying both:

1. **Community belonging** - "I'm part of this active thing"
2. **Identity expression** - "This is MY message"

## Why This Approach

The current share image shows a single message in isolation. This feels disconnected and doesn't communicate the social/community aspect of PUBLIC_TERMINAL.

**User insight:** People share when they feel part of something AND can express their identity. Showing the message alone misses the "part of something" angle entirely.

**Solution:** Show a "screenshot" of the feed with the user's message prominently highlighted among real surrounding messages.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout style | Feed screenshot | Most authentic "I'm part of this" feeling |
| Message highlight | Strong contrast | User's message at full brightness, others dimmed (40-50% opacity) |
| Data source | Real messages from contract | Authenticity matters - fake placeholders feel artificial |
| Message count | 3-5 messages | Enough to show activity without clutter |
| User position | Center/prominent | Their message is the hero, others provide context |

## Design Spec

### Visual Structure

```
┌─────────────────────────────────────────┐
│ PUBLIC_TERMINAL          #47 of 523     │  <- Header
├─────────────────────────────────────────┤
│ #45 [2026.01.29 14:22]                  │  <- Dimmed (40% opacity)
│ <alice> previous message here...        │
├─────────────────────────────────────────┤
│ #46 [2026.01.29 14:25]                  │  <- Dimmed
│ <bob> another message...                │
├─────────────────────────────────────────┤
│ ▌#47 [2026.01.29 14:30]                 │  <- HIGHLIGHTED (full brightness)
│ ▌<username> YOUR MESSAGE HERE           │     Maybe subtle left border/glow
├─────────────────────────────────────────┤
│ #48 [2026.01.29 14:35]                  │  <- Dimmed
│ <eve> message after yours...            │
└─────────────────────────────────────────┘
```

### Data Requirements

The OG image endpoint needs:
- User's message (already have: tokenId, username, text, color, timestamp)
- Surrounding messages (NEW: fetch from contract based on tokenId position)
- Total message count (already have)

### Technical Approach

1. Given a tokenId, fetch messages around it (e.g., tokenId-2 to tokenId+2)
2. Render all messages in feed style
3. Apply dimming to all except the target message
4. Handle edge cases: first messages (no previous), most recent (no next)

## Open Questions

1. **How many surrounding messages?** Start with 2 above + 1 below (4 total) - can adjust
2. **Highlight style?** Left border accent vs background highlight vs glow - needs visual testing
3. **What if user is message #1?** Show only messages after them
4. **Performance:** Contract calls add latency - acceptable for share image generation?

## Success Criteria

- Share image clearly shows user's message in feed context
- Other messages are visible but user's stands out immediately
- Feels like "I'm part of an active community"
- Drives higher share rate (qualitative - users feel more compelled to share)

## Next Steps

Run `/workflows:plan` to create implementation plan for:
1. Update `/api/opengraph-image/mint` endpoint to fetch surrounding messages
2. New image layout with feed-style rendering
3. Dimming/highlight styling
4. Update share preview in App.tsx to use new endpoint
