export const PUBLIC_TERMINAL_ABI = [
  // Errors
  {
    type: "error",
    name: "InvalidSignature",
  },
  {
    type: "error",
    name: "MessageTooLong",
  },
  {
    type: "error",
    name: "MessageEmpty",
  },
  {
    type: "error",
    name: "UsernameTooLong",
  },
  {
    type: "error",
    name: "UsernameEmpty",
  },
  {
    type: "error",
    name: "InsufficientPayment",
  },

  // Constants
  {
    type: "function",
    name: "FEED_TOKEN_OFFSET",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "FEED_MESSAGE_COUNT",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },

  // Mint function
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "fid", type: "uint256" },
      { name: "username", type: "string" },
      { name: "text", type: "string" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "payable",
  },

  // Pin mint function
  {
    type: "function",
    name: "mintPin",
    inputs: [
      { name: "fid", type: "uint256" },
      { name: "username", type: "string" },
      { name: "text", type: "string" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "payable",
  },

  // View functions
  {
    type: "function",
    name: "getRecentMessages",
    inputs: [{ name: "count", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "id", type: "uint256" },
          { name: "author", type: "address" },
          { name: "fid", type: "uint256" },
          { name: "username", type: "string" },
          { name: "text", type: "string" },
          { name: "timestamp", type: "uint256" },
          { name: "usernameColor", type: "bytes3" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMessage",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "author", type: "address" },
          { name: "fid", type: "uint256" },
          { name: "username", type: "string" },
          { name: "text", type: "string" },
          { name: "timestamp", type: "uint256" },
          { name: "usernameColor", type: "bytes3" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMessageCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  // Get pinned message
  {
    type: "function",
    name: "getPinnedMessage",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "author", type: "address" },
          { name: "fid", type: "uint256" },
          { name: "username", type: "string" },
          { name: "text", type: "string" },
          { name: "timestamp", type: "uint256" },
          { name: "usernameColor", type: "bytes3" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getColorForFid",
    inputs: [{ name: "fid", type: "uint256" }],
    outputs: [{ name: "", type: "bytes3" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tokenURI",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ownerOf",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "messages",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "author", type: "address" },
      { name: "fid", type: "uint256" },
      { name: "username", type: "string" },
      { name: "text", type: "string" },
      { name: "timestamp", type: "uint256" },
      { name: "usernameColor", type: "bytes3" },
    ],
    stateMutability: "view",
  },

  // Events
  {
    type: "event",
    name: "MessageMinted",
    inputs: [
      { name: "author", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "fid", type: "uint256", indexed: true },
      { name: "username", type: "string", indexed: false },
      { name: "text", type: "string", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
      { name: "usernameColor", type: "bytes3", indexed: false },
    ],
  },
  {
    type: "event",
    name: "FeedMinted",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "feedTokenId", type: "uint256", indexed: true },
      { name: "messageTokenId", type: "uint256", indexed: true },
    ],
  },
  // ERC-4906: Metadata Update Extension
  {
    type: "event",
    name: "MetadataUpdate",
    inputs: [{ name: "_tokenId", type: "uint256", indexed: false }],
  },
  {
    type: "event",
    name: "BatchMetadataUpdate",
    inputs: [
      { name: "_fromTokenId", type: "uint256", indexed: false },
      { name: "_toTokenId", type: "uint256", indexed: false },
    ],
  },
  // Pin message event
  {
    type: "event",
    name: "PinSet",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "previousTokenId", type: "uint256", indexed: true },
    ],
  },
] as const;

// Contract address on Base Mainnet (v7 with pin messages, 0.0005 ETH base price)
export const CONTRACT_ADDRESS = "0x5a14B368718699065EB8d813337B4A6F0C3C35C7";

// Price: 0.0005 ETH
export const PRICE_WEI = 500000000000000n;

// Pin price: 0.005 ETH (10x regular)
export const PIN_PRICE_WEI = 5000000000000000n;

// Constants matching contract
export const MAX_MESSAGE_LENGTH = 120;
export const MAX_USERNAME_LENGTH = 64;
export const FEED_TOKEN_OFFSET = 1000000000n; // Feed tokens start at 1 billion
export const FEED_MESSAGE_COUNT = 15;

// ANSI color palette for reference
export const ANSI_COLORS = {
  RED: "#FF0000",
  LIME: "#00FF00",
  BLUE: "#0000FF",
  YELLOW: "#FFFF00",
  MAGENTA: "#FF00FF",
  CYAN: "#00FFFF",
  ORANGE: "#FFA500",
} as const;

// Message type for TypeScript
export interface Message {
  id: bigint;
  author: `0x${string}`;
  fid: bigint;
  username: string;
  text: string;
  timestamp: bigint;
  usernameColor: `0x${string}`;
}
