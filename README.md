# PUBLIC_TERMINAL

A Farcaster mini app for minting permanent text transmissions to the blockchain.

## What is it?

PUBLIC_TERMINAL lets you broadcast messages that live forever on-chain. Each transmission is minted as an NFT on Base, signed with your Farcaster username and a unique color.

When you mint, you receive:
1. **Message Artifact** - Your permanent text on-chain
2. **Feed View** - A dynamic NFT showing the 15 most recent transmissions

## Features

- Terminal-themed UI with retro aesthetic
- 120 character message limit
- Unique username colors derived from your FID
- Shareable OG images for your transmissions
- Live feed of recent messages

## Tech Stack

- **Framework**: Next.js 15 + React 19
- **Blockchain**: Base (EVM)
- **Wallet**: Wagmi + Viem
- **Farcaster**: Neynar SDK + Mini App SDK
- **Styling**: Tailwind CSS

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run development server
npm run dev
```

## Environment Variables

```
NEXT_PUBLIC_URL=http://localhost:3000
NEYNAR_API_KEY=your_neynar_api_key
NEYNAR_CLIENT_ID=your_neynar_client_id
MINT_SIGNER_PRIVATE_KEY=your_mint_signer_private_key
```

## Contract

Deployed on Base Sepolia: `0x3748cE0E2d27e853C8507A2e3fc4036EA08C4f8A`

## License

MIT
