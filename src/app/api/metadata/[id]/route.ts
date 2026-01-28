import type { NextRequest } from "next/server";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { CONTRACT_ADDRESS, PUBLIC_TERMINAL_ABI, type Message } from "~/lib/contractABI";

const RPC_URL = process.env.RPC_URL || "https://sepolia.base.org";

// Convert bytes3 color to hex string
function bytes3ToHex(color: `0x${string}`): string {
  const hex = color.replace("0x", "").padStart(6, "0");
  return `#${hex}`;
}

// Format timestamp to readable date
function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toISOString();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = Number(idStr);

  if (!id || id < 1) {
    return Response.json({ error: "bad id" }, { status: 400 });
  }

  try {
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(RPC_URL),
    });

    // Query the message data
    const messageData = (await client.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PUBLIC_TERMINAL_ABI,
      functionName: "getMessage",
      args: [BigInt(id)],
    })) as Message;

    if (!messageData || !messageData.username) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    const colorHex = bytes3ToHex(messageData.usernameColor);
    const timestamp = formatTimestamp(messageData.timestamp);

    const name = `PUBLIC_TERMINAL #${id}`;
    const description = messageData.text;

    const attributes = [
      { trait_type: "Author", value: messageData.username },
      { trait_type: "FID", value: messageData.fid.toString() },
      { trait_type: "Color", value: colorHex },
      { trait_type: "Timestamp", value: timestamp },
    ];

    // The actual image comes from the on-chain tokenURI
    // This endpoint provides supplementary metadata

    return Response.json(
      {
        name,
        description,
        attributes,
        external_url: `https://publicterminal.xyz/artifact/${id}`,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=600",
        },
      }
    );
  } catch (error) {
    console.error("Metadata error:", error);
    return Response.json(
      { error: "Failed to fetch metadata" },
      { status: 500 }
    );
  }
}
