# Public_Terminal - Farcaster Mini App Architecture Guide

## Project Overview

**Public_Terminal** is a Farcaster Mini App (formerly Frames v2) built with modern web technologies. It's a full-stack application that integrates with the Farcaster ecosystem, Neynar SDK, and blockchain wallets (EVM and Solana). The project serves as an extensible template for building interactive Farcaster mini apps with wallet functionality and real-time user context.

### Project Type

- **Full-Stack Web Application** - NextJS frontend + API backend
- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript with strict type checking
- **Target Platform**: Farcaster ecosystem, deployable to Vercel

### Core Purpose

A starter template/mini app framework for:

- Building interactive Farcaster mini apps
- Managing Farcaster authentication via QuickAuth
- Integrating EVM wallets (MetaMask, Coinbase Wallet, Farcaster Frame)
- Integrating Solana wallets
- Sending and receiving notifications
- Managing user context and Farcaster data

---

## Directory Structure & Architecture

```
public-terminal/
├── src/                           # Source code
│   ├── app/                       # Next.js App Router (13+ structure)
│   │   ├── layout.tsx             # Root layout wrapper
│   │   ├── page.tsx               # Main homepage route
│   │   ├── providers.tsx          # Client-side provider wrapper (MiniAppProvider, WagmiProvider, etc.)
│   │   ├── app.tsx                # Dynamic app component wrapper
│   │   ├── globals.css            # Global styles & design system
│   │   ├── api/                   # API routes (server-side)
│   │   │   ├── auth/              # Authentication endpoints
│   │   │   │   ├── nonce/         # POST /api/auth/nonce - fetch nonce for signing
│   │   │   │   ├── signer/        # POST /api/auth/signer - register signer
│   │   │   │   ├── signer/signed_key/ # POST - get signed key
│   │   │   │   ├── signers/       # GET /api/auth/signers - list signers
│   │   │   │   ├── session-signers/ # GET - get session signers
│   │   │   │   └── validate/      # POST /api/auth/validate - validate auth token
│   │   │   ├── users/             # GET /api/users - fetch user data
│   │   │   ├── best-friends/      # User social data endpoints
│   │   │   ├── webhook/           # POST /api/webhook - Neynar webhook receiver
│   │   │   ├── send-notification/ # POST - send Neynar notifications
│   │   │   ├── opengraph-image/   # GET /api/opengraph-image - OG image generation
│   │   │   └── .well-known/       # Farcaster manifest & metadata
│   │   └── share/                 # Share functionality routes
│   │       └── [fid]/page.tsx     # Dynamic share page by FID
│   ├── components/                # React components
│   │   ├── App.tsx                # Main App component (orchestrates tabs)
│   │   ├── ui/                    # UI components
│   │   │   ├── Header.tsx         # App header
│   │   │   ├── Footer.tsx         # Tab navigation footer
│   │   │   ├── Button.tsx         # Reusable button component
│   │   │   ├── input.tsx          # Input component
│   │   │   ├── label.tsx          # Label component
│   │   │   ├── Share.tsx          # Share functionality
│   │   │   ├── tabs/              # Tab content components
│   │   │   │   ├── HomeTab.tsx    # Home/landing tab
│   │   │   │   ├── ActionsTab.tsx # Actions/interactions tab
│   │   │   │   ├── ContextTab.tsx # Farcaster context display tab
│   │   │   │   ├── WalletTab.tsx  # Wallet management tab
│   │   │   │   └── index.ts       # Tab exports
│   │   │   └── wallet/            # Wallet-specific components
│   │   │       ├── SignEvmMessage.tsx   # EVM message signing
│   │   │       ├── SignSolanaMessage.tsx # Solana message signing
│   │   │       ├── SendEth.tsx    # Send ETH transactions
│   │   │       ├── SendSolana.tsx # Send Solana transactions
│   │   │       ├── SignIn.tsx     # Authentication UI
│   │   │       └── index.ts
│   │   └── providers/             # Context/provider components
│   │       ├── WagmiProvider.tsx  # Wagmi config & EVM wallet setup
│   │       └── SafeFarcasterSolanaProvider.tsx # Solana provider wrapper
│   ├── hooks/                     # Custom React hooks
│   │   ├── useNeynarUser.ts       # Hook to fetch Neynar user data
│   │   ├── useQuickAuth.ts        # Hook for QuickAuth flow
│   │   └── useDetectClickOutside.ts # Utility hook
│   └── lib/                       # Utility functions & constants
│       ├── constants.ts           # App configuration & constants (NOTE: auto-updated by init script)
│       ├── neynar.ts              # Neynar API client & helper functions
│       ├── utils.ts               # Helper utilities (cn, getMiniAppEmbedMetadata)
│       ├── kv.ts                  # Key-value store integration (Upstash Redis)
│       ├── localStorage.ts        # Browser localStorage helpers
│       ├── devices.ts             # Device detection utilities
│       ├── errorUtils.tsx         # Error rendering & handling
│       ├── truncateAddress.ts     # Address formatting
│       └── notifs.ts              # Notification helpers
├── public/                        # Static assets
│   ├── icon.png                  # App icon
│   └── splash.png                # Splash screen
├── scripts/                       # Build & deployment scripts
│   ├── dev.js                    # Local dev server with localtunnel support
│   ├── deploy.ts                 # Vercel deployment with env setup
│   └── cleanup.js                # Port cleanup utility
├── .github/
│   └── workflows/
│       └── publish.yml           # GitHub Actions: Auto-publish to npm
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript configuration
├── next.config.ts                 # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── postcss.config.mjs             # PostCSS configuration
├── .eslintrc.json                 # ESLint rules
├── .env.local                     # Local environment variables
├── .env.example (implied)         # Example env file
├── components.json                # shadcn/ui config (if using)
├── vercel.json                    # Vercel deployment config
└── README.md                      # Project documentation
```

---

## Key Technologies & Frameworks

### Frontend Framework

- **Next.js 15**: React-based full-stack framework

  - App Router (src/app directory structure)
  - Server Components (RSC) by default
  - API Routes for backend functionality
  - Image optimization and static generation

- **React 19**: UI library with hooks and dynamic features
  - Client components with `'use client'` directive
  - Server-side rendering where beneficial

### Authentication & Wallet Integration

- **@farcaster/miniapp-sdk**: Official Farcaster mini app SDK
  - Access to user context (FID, signer, profile data)
  - QuickAuth for user authentication
  - Safe area insets for mobile UI
- **@farcaster/auth-client**: Farcaster authentication
- **@farcaster/quick-auth**: Simplified auth flow (v0.0.7+)
- **@farcaster/miniapp-wagmi-connector**: Bridge between Farcaster and Wagmi
- **@farcaster/mini-app-solana**: Solana wallet integration

### EVM Blockchain Integration

- **Wagmi 2.14+**: React hooks for Ethereum clients

  - Multi-chain support (Ethereum, Polygon, Optimism, Arbitrum, Base, Degen, Unichain, Celo)
  - Multiple wallet connectors
  - Transaction handling and signing

- **Viem 2.23+**: Ethereum client library (used by Wagmi)
- **wagmi/connectors**:

  - MetaMask connector
  - Coinbase Wallet connector
  - Farcaster Frame connector (auto-connect in Farcaster)

- **siwe 3.0**: Sign-In with Ethereum for message signing

### Solana Integration

- **@solana/wallet-adapter-react**: Solana wallet adapter
- **@farcaster/mini-app-solana**: Farcaster-specific Solana provider

### Data & API

- **@neynar/react**: React SDK for Neynar (v1.2.15+)

  - `MiniAppProvider` for Farcaster context
  - Analytics
  - Notifications

- **@neynar/nodejs-sdk**: Server-side Neynar client (v2.19.0+)

  - Fetch user data
  - Send notifications
  - Webhook management

- **@tanstack/react-query 5.61+**: Data fetching & caching
- **@upstash/redis 1.34+**: Redis client for serverless key-value storage

### Form & Validation

- **Zod 3.24+**: TypeScript-first schema validation
- **@radix-ui/react-label**: Accessible label component

### Styling & UI

- **Tailwind CSS 3.4**: Utility-first CSS framework
- **tailwindcss-animate**: Animation utilities
- **tailwind-merge**: Merge Tailwind classes without conflicts
- **clsx**: Conditional classname utility
- **class-variance-authority 0.7**: Component variant management
- **lucide-react**: Icon library

### Utilities

- **dotenv 16.4+**: Environment variable management
- **ts-node**: Execute TypeScript directly
- **tsx**: CLI for running TypeScript files

### Development & Build

- **TypeScript 5**: Static type checking
- **ESLint 8**: Code linting (with Next.js rules)
- **Node.js 20+** (recommended for Vercel)

---

## Testing Setup

### Current State

## Linting & Code Quality

### ESLint Configuration (`.eslintrc.json`)

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"]
}
```

**Custom Rules**:

- `@next/next/no-img-element`: OFF (intentional <img> usage)
- `@typescript-eslint/ban-ts-comment`: OFF (allows @ts-ignore)
- `@typescript-eslint/no-explicit-any`: OFF (allows `any` for dynamic APIs)
- `@typescript-eslint/no-unused-vars`: WARN (allows underscore-prefixed)
- `react/display-name`: WARN
- `react-hooks/exhaustive-deps`: WARN

### Linting Command

```bash
npm run lint        # Runs ESLint and TypeScript checks
```

### Formatting

- No Prettier config provided (uses defaults)
- Recommended: add `.prettierrc` for consistent formatting

---

## Development Server

### Starting Development

```bash
npm run dev
```

**What happens**:

1. Loads environment variables from `.env.local`
2. Checks if port 3000 is available
3. Optionally creates localtunnel if `USE_TUNNEL=true`
4. Starts Next.js dev server with HMR
5. Sets `NEXT_PUBLIC_URL` environment variable

### Port Management

- Default port: 3000
- Can override: `npm run dev -- --port 3001`
- Cleanup script: `npm run cleanup` (kills process on stuck port)

### Hot Module Replacement

- Enabled by default in Next.js dev mode
- Components and styles auto-refresh without full reload

---

## Special Configurations & Architectural Patterns

### 1. **Client-Side vs Server-Side Rendering**

- **Server Components** (default): Used for layout, data fetching
  - `src/app/layout.tsx`: Root HTML structure
  - `src/app/page.tsx`: Metadata generation
- **Client Components**: Marked with `'use client'` for interactivity

  - `src/app/providers.tsx`: Provider setup
  - `src/components/App.tsx`: Main component
  - All UI components using React hooks

- **Dynamic Imports**: Used for SDK-dependent code (avoids hydration errors)
  ```tsx
  const AppComponent = dynamic(() => import("~/components/App"), {
    ssr: false, // Ensures SDK loads only on client
  });
  ```

### 2. **Provider Architecture**

Three-tier provider setup in `src/app/providers.tsx`:

```
WagmiProvider (EVM wallets)
  ↓
MiniAppProvider (Neynar SDK, context, analytics)
  ↓
SafeFarcasterSolanaProvider (Solana wallets)
```

**Order matters**: Each provider depends on the one above.

### 3. **Authentication Flow**

#### QuickAuth (Recommended)

1. User calls `sdk.quickAuth.getToken()`
2. Returns JWT token valid for session
3. Validated server-side via `/api/auth/validate`
4. Token stored in memory only (no persistence)
5. Automatically cleared when user signs out of Farcaster

**Hook**: `useQuickAuth()` manages full flow

#### Traditional Auth (Farcaster Signers)

1. Fetch nonce: `/api/auth/nonce`
2. Create signer: `/api/auth/signer`
3. Sign with Farcaster app
4. Retrieve signed key: `/api/auth/signer/signed_key`
5. Store session signers for continued use

### 4. **Data Fetching Patterns**

#### Client-Side (Hooks)

- `useNeynarUser()`: Fetches user data by FID
  ```tsx
  const { user, loading, error } = useNeynarUser(context);
  ```

#### Server-Side (API Routes)

- `/api/users`: Calls Neynar SDK to fetch user profiles
- `/api/best-friends`: Social graph data
- All validate against Neynar API key

#### React Query Integration

- Configured in `WagmiProvider.tsx`
- Used for wallet operations caching
- Can extend for other data fetching

### 5. **Environment Variables**

#### .env.local (Local Development)

```
NEXT_PUBLIC_URL='http://localhost:3000'         # Public URL
NEXTAUTH_URL='http://localhost:3000'            # Auth URL
NEYNAR_API_KEY='...'                            # Neynar API
NEYNAR_CLIENT_ID='...'                          # Neynar Client
USE_TUNNEL='true'                               # Enable localtunnel
KV_REST_API_URL=''                              # Upstash Redis (optional)
KV_REST_API_TOKEN=''                            # Upstash Redis token
SOLANA_RPC_ENDPOINT='https://...'               # Solana RPC
```

#### Build-Time (.env or .env.production)

- Set via deployment platform (Vercel)
- Accessed in API routes and server components
- NOT prefixed with `NEXT_PUBLIC_`

#### Client-Side (NEXT*PUBLIC*\*)

- Only `NEXT_PUBLIC_URL` and `NEXTAUTH_URL`
- Exposed to browser via `process.env.NEXT_PUBLIC_*`

### 6. **Design System**

**globals.css** defines reusable component classes:

- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`
- `.card`, `.card-primary`
- `.input`, `.input-focus`
- `.container`, `.container-wide`, `.container-narrow`
- `.spinner`, `.spinner-primary`
- `.focus-ring`

**tailwind.config.ts** provides theme:

- **Color Palette**:
  - Primary: `#8b5cf6` (purple)
  - Primary-light: `#a78bfa`
  - Primary-dark: `#7c3aed`
  - Secondary: `#f8fafc` (light), `#334155` (dark)
- **Dark Mode**: `prefers-color-scheme: media`
- **Custom Spacing**: `.spacing-18`, `.spacing-88`
- **Max Widths**: `.max-w-xs` through `.max-w-2xl`

**To change theme**: Update `tailwind.config.ts` primary color

### 7. **Tab Navigation Pattern**

Main app uses tab-based UI:

```
enum Tab {
  Home = "home",       // HomeTab.tsx
  Actions = "actions", // ActionsTab.tsx
  Context = "context", // ContextTab.tsx
  Wallet = "wallet"    // WalletTab.tsx
}
```

- Managed by `useMiniApp()` hook
- Footer renders navigation buttons
- Content conditional on `currentTab`

### 8. **Wallet Integration Patterns**

#### EVM Wallets (Wagmi)

```tsx
const { address, chainId } = useAccount();
const { sendTransaction } = useSendTransaction();
const { signTypedData } = useSignTypedData();
const { switchChain } = useSwitchChain();
```

#### Solana Wallets

```tsx
const { publicKey, wallet } = useSolanaWallet();
const { signMessage } = useSolanaWallet();
```

#### Auto-Connection

- Farcaster Frame: Auto-connects if in Farcaster client
- Coinbase Wallet: Custom hook detects and auto-connects
- MetaMask: Available but manual connection

### 9. **Farcaster Mini App Manifest**

Defined in `src/lib/utils.ts` → `getMiniAppEmbedMetadata()`:

- Title, description, icon, splash image
- Button text and action
- Categories and tags for app store
- Webhook URL for notifications

Updated via `/src/app/.well-known/farcaster.json/route.ts`

### 10. **API Route Patterns**

All API routes in `src/app/api/`:

- Use Next.js `NextResponse` for consistency
- Return JSON
- Support CORS if needed
- Validate Neynar API key before operations

Example pattern:

```tsx
export async function GET(request: Request) {
  try {
    // Extract query params or body
    // Call Neynar client or service
    // Return success response
  } catch (error) {
    return NextResponse.json({ error: "Descriptive message" }, { status: 500 });
  }
}
```

### 11. **NFT Minting & Share Flow**

The minting and sharing process has three key stages:

**Stage 1: Minting (Client-side rendering)**
- User enters handle and clicks "MINT" button
- Client renders Wingdings font to canvas using `rasterizeWingdingsToGrid()` in `App.tsx`
- Canvas is converted to PNG data URL
- PNG is uploaded to IPFS via `/api/mint` endpoint (Pinata gateway)
- Backend returns IPFS URL (e.g., `https://gateway.pinata.cloud/ipfs/bafreid...`)

**Stage 2: Contract Registration**
- Backend signs the mint transaction with `/api/sign-mint`
- User submits transaction to smart contract with handle + IPFS URL
- Contract stores mapping: `tokenId → (handle, imageURI)`

**Stage 3: Share Page & OG Image Generation**
- Share URL: `/share/{tokenId}?handle={handle}&imageUri={ipfsUrl}`
- Server fetches metadata via `generateMetadata()` in `src/app/share/[fid]/page.tsx`
- If `imageUri` not provided in query params, fetches from contract via `/api/token-image/{id}`
- `/api/token-image/{id}` reads contract's `tokenURI` and extracts the image field from JSON metadata
- OG image generator (`/api/opengraph-image/web3ding`) receives clean IPFS URL
- OG image displays the actual minted PNG centered on background

**Key Design Decisions:**
- Canvas rendering happens client-side (can't run on server with fonts)
- IPFS URL is the source of truth, not regenerated
- Share page intelligently falls back to contract data if imageUri not in query
- `/api/token-image/{id}` handles both data URLs and direct IPFS URLs from contract

---

## Entry Points & Main Files

### Application Entry Points

1. **Browser Entry**: `src/app/page.tsx`

   - Generates metadata
   - Renders App component

2. **App Component**: `src/components/App.tsx`

   - Initializes Farcaster SDK via `useMiniApp()`
   - Manages tab state
   - Renders appropriate tab content
   - Main orchestration component

3. **Layout/Providers**: `src/app/layout.tsx`

   - HTML structure
   - Loads `Providers` component
   - Sets metadata

4. **Providers**: `src/app/providers.tsx`
   - Sets up context providers
   - Client-side wrapper

### API Entry Points

- `/api/auth/*`: Authentication endpoints
- `/api/users`: User data
- `/api/webhook`: Incoming Neynar events
- `/api/send-notification`: Push notifications
- `/api/mint`: POST - Upload PNG to IPFS and prepare mint data
- `/api/sign-mint`: POST - Sign mint transactions
- `/api/metadata/[id]`: GET - Fetch NFT metadata
- `/api/token-image/[id]`: GET - Fetch actual image URL from contract's tokenURI
- `/api/opengraph-image/web3ding`: GET - Generate OG images for share links
- `/.well-known/farcaster.json`: Mini app manifest

### Development Entry Points

- **Dev Script**: `scripts/dev.js`

  - Starts Next.js dev server
  - Optional localtunnel for mobile testing
  - Port management

- **Deploy Script**: `scripts/deploy.ts`
  - Interactive Vercel deployment
  - Environment setup
  - Project creation

---

## Dependencies Management

### Package Manager

- **npm** (package-lock.json)
- Node 20+ recommended
- Uses npm workspaces if monorepo

### Dependency Categories

#### Core Runtime (Production)

- `next`, `react`, `react-dom`: Framework
- `@farcaster/*`: Farcaster SDK
- `@neynar/*`: Neynar integration
- `wagmi`, `viem`: EVM
- `@solana/wallet-adapter-react`: Solana
- Styling, UI components, utilities

#### Development Only

- `typescript`, `@types/*`: Type checking
- `eslint`, `eslint-config-next`: Linting
- `tailwindcss`, `postcss`: CSS processing
- `tsx`, `ts-node`: TypeScript execution
- `inquirer`: CLI prompts (deploy script)
- `localtunnel`: URL tunneling
- `@vercel/sdk`: Deployment

#### Special Overrides

- Many `chalk`, `ansi-*` dependencies locked to specific versions
- Prevents terminal output conflicts in build scripts
- See `package.json` → `overrides` and `resolutions`

### Installing Dependencies

```bash
npm install              # Install all
npm install pkg --save   # Add runtime dep
npm install pkg --save-dev # Add dev dep
npm ci                   # Clean install (CI/CD)
```

### Updating Dependencies

```bash
npm update              # Update minor/patch
npm outdated           # Show available upgrades
npm audit              # Security audit
```

---

## Development Workflow

### Local Setup

```bash
git clone <repo>
cd public-terminal
npm install
npm run dev
```

### Typical Development Flow

1. **Edit code** in `src/`
2. **Dev server auto-reloads** (HMR)
3. **Test locally** at `http://localhost:3000`
4. **Run linting** with `npm run lint`
5. **Commit** and push

### Before Deployment

```bash
npm run lint      # Check for errors
npm run deploy:vercel  # Deploy to Vercel
```

### Frame SDK Behavior

- **Only works client-side**: Requires browser environment
- **No SSR**: Use `'use client'` and dynamic imports
- **Initialize once**: Loaded by MiniAppProvider in Providers
- **Access via hooks**: `useMiniApp()`, `useQuickAuth()`, etc.

### Safe Area Insets

- Mobile browsers have notches/bars
- Farcaster SDK provides safe area values
- Applied via inline styles in App.tsx
- Essential for full-screen layouts

### Environment Variable Loading

- `.env.local` loaded by `dev.js` script
- `.env` file for build-time variables
- `NEXT_PUBLIC_` prefix for client-side access

### State Management

- No global state library (Redux, Zustand) included
- Uses React Context via Providers
- React Query for async data
- Hook-based state for components

### Hot Reload Caveats

- Server-side changes require restart
- Client-side changes hot reload
- Dynamic routes work with HMR
- API route changes need restart

---

## Security Considerations

- **API Keys**: Store in `.env`, never commit
- **Client-Side Access**: Only use `NEXT_PUBLIC_` prefixed vars
- **QuickAuth Tokens**: In-memory only, not persisted
- **Neynar API**: Validate requests server-side
- **Webhook Validation**: Verify Neynar signatures
- **CORS**: Configure if calling external APIs

---

## Quick Reference Commands

```bash
npm run dev              # Start dev server
npm run start            # Run production server
npm run lint             # Check code quality
npm run cleanup          # Kill stuck processes on port 3000
npm run deploy:vercel    # Deploy to Vercel interactively
npm run deploy:raw       # Raw Vercel CLI deploy
```

---

## Notes for AI/Developers

### ⚠️ Build Notes

**Skip `npm run build` for now** - There is a known Next.js caching issue with the build process. The dev server works perfectly fine with `npm run dev`. The build artifacts and production build verification should be deferred until the Next.js build cache issue is resolved.

### What NOT to Change

- `.claude/` directory (Claude Code metadata)
- `node_modules/`
- `.next/` (build output)
- `package-lock.json` (unless resolving conflicts)
- `globals.css` (unless fixing accessibility/bugs)

### Where to Add Features

- **New Components**: `src/components/`
- **New API Routes**: `src/app/api/`
- **New Hooks**: `src/hooks/`
- **New Utilities**: `src/lib/`
- **New Pages**: `src/app/` (use App Router)

### Design Philosophy

- Mobile-first responsive design
- Dark mode support via Tailwind
- Minimal custom CSS (prefer Tailwind utilities)
- Component-based architecture
- Server Components where possible

### Common Patterns

- Use `cn()` helper for className merging
- Use Tailwind for all styling
- Use hooks for state management
- Use dynamic imports for SDK code
- Use API routes for server operations

---

**Last Updated**: October 29, 2025
**Version**: 0.1.0 (initial commit)
