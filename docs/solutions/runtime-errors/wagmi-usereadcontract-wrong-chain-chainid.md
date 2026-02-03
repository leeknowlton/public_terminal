---
title: "Fix Error Loading Feed - wagmi useReadContract Missing chainId"
category: runtime-errors
tags:
  - wagmi
  - viem
  - base-mainnet
  - chain-migration
  - useReadContract
  - usePublicClient
  - network-detection
module: feed/contract-reads
symptoms:
  - "Error loading feed" displayed when users connected to wrong network
  - Contract reads silently fail without specifying target chain
  - App appears broken despite contracts being deployed correctly
  - Feed loads on Base but fails on Ethereum, Polygon, etc.
date_solved: 2026-02-03
---

# Fix: wagmi useReadContract Fails on Wrong Chain

## Problem

After migrating from Base Sepolia to Base Mainnet, users saw "Error loading feed" when their wallet was connected to any chain other than Base mainnet.

## Root Cause

**wagmi's `useReadContract` hook defaults to reading from the user's currently connected chain.**

When users connected their wallet on a different network (Ethereum mainnet, Polygon, Arbitrum, etc.), the contract read calls failed because the Public Terminal smart contract only exists on Base mainnet (chain ID 8453).

The same issue affected `usePublicClient` - it returns a client for the user's current chain rather than the target chain.

```typescript
// BROKEN: Reads from user's current chain (could be any chain)
const { data: messages } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: PUBLIC_TERMINAL_ABI,
  functionName: "getRecentMessages",
  args: [BigInt(count)],
});
```

## Solution

Add explicit `chainId` parameter to all contract read calls:

```typescript
// FIXED: Always reads from Base mainnet
const { data: messages } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: PUBLIC_TERMINAL_ABI,
  functionName: "getRecentMessages",
  args: [BigInt(count)],
  chainId: 8453, // Always read from Base mainnet
});
```

### Files Modified

#### 1. FeedView.tsx

```typescript
const { data: messages } = useReadContract({
  address: CONTRACT_ADDRESS as `0x${string}`,
  abi: PUBLIC_TERMINAL_ABI,
  functionName: "getRecentMessages",
  args: [BigInt(count)],
  chainId: 8453, // Always read from Base mainnet
});

const { data: pinnedMessage } = useReadContract({
  address: CONTRACT_ADDRESS as `0x${string}`,
  abi: PUBLIC_TERMINAL_ABI,
  functionName: "getPinnedMessage",
  chainId: 8453, // Always read from Base mainnet
});
```

#### 2. MyArtifacts.tsx

```typescript
const publicClient = usePublicClient({ chainId: 8453 });

const { data: balance } = useReadContract({
  address: CONTRACT_ADDRESS as `0x${string}`,
  abi: PUBLIC_TERMINAL_ABI,
  functionName: "balanceOf",
  args: address ? [address] : undefined,
  chainId: 8453, // Always read from Base mainnet
  query: { enabled: !!address },
});

const { data: totalSupply } = useReadContract({
  address: CONTRACT_ADDRESS as `0x${string}`,
  abi: PUBLIC_TERMINAL_ABI,
  functionName: "totalSupply",
  chainId: 8453, // Always read from Base mainnet
});
```

#### 3. App.tsx

```typescript
const BASE_CHAIN_ID = 8453;

const publicClient = usePublicClient({ chainId: BASE_CHAIN_ID });

const { data: messageCount } = useReadContract({
  address: CONTRACT_ADDRESS as `0x${string}`,
  abi: PUBLIC_TERMINAL_ABI,
  functionName: "getMessageCount",
  chainId: BASE_CHAIN_ID,
});

const { data: colorData } = useReadContract({
  address: CONTRACT_ADDRESS as `0x${string}`,
  abi: PUBLIC_TERMINAL_ABI,
  functionName: "getColorForFid",
  args: [BigInt(context?.user?.fid || 0)],
  chainId: BASE_CHAIN_ID,
});
```

## Prevention Strategies

### 1. Code Review Checklist

When reviewing wagmi contract reads, verify:
- [ ] `chainId` is explicitly specified
- [ ] `usePublicClient` has `chainId` parameter if used for specific chain
- [ ] Chain constant is used (not hardcoded number)

### 2. Pattern to Follow

```typescript
// Define chain constant
const CONTRACT_CHAIN_ID = 8453; // Base mainnet

// Always include chainId in reads
const { data } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: "someFunction",
  chainId: CONTRACT_CHAIN_ID, // <-- Required!
});

// Always include chainId in publicClient
const client = usePublicClient({ chainId: CONTRACT_CHAIN_ID });
```

### 3. Custom Hook Wrapper (Optional)

```typescript
import { useReadContract, usePublicClient } from "wagmi";
import { CONTRACT_ADDRESS, PUBLIC_TERMINAL_ABI } from "~/lib/contractABI";

const CONTRACT_CHAIN_ID = 8453;

export function useContractRead(functionName: string, args?: unknown[]) {
  return useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PUBLIC_TERMINAL_ABI,
    functionName,
    args,
    chainId: CONTRACT_CHAIN_ID, // Enforced by default
  });
}

export function useBasePublicClient() {
  return usePublicClient({ chainId: CONTRACT_CHAIN_ID });
}
```

### 4. When This Matters

**Matters:**
- Single-chain dApps with multi-chain wallet support
- Apps deployed to one chain but users may be connected to others
- NFT/DeFi apps on specific L2s (Base, Optimism, Arbitrum)

**Doesn't Matter:**
- Multi-chain dApps where contract exists on all supported chains
- Apps that force chain switching before any interaction

## Key Insight

Contract **reads** can specify any chain regardless of user's wallet connection. Contract **writes** require the user to be on the correct chain. This allows your app to display data (read) even when the user needs to switch chains to interact (write).

## Summary Table

| Hook | Parameter | Purpose |
|------|-----------|---------|
| `useReadContract` | `chainId: 8453` | Read from specific chain |
| `usePublicClient` | `{ chainId: 8453 }` | Get client for specific chain |
| `useSwitchChain` | N/A | Prompt user to switch for writes |
