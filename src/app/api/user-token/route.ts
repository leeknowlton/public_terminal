import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { CONTRACT_ADDRESS, PUBLIC_TERMINAL_ABI } from "~/lib/contractABI";

const RPC_URL = process.env.RPC_URL || "https://sepolia.base.org";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Missing address parameter" },
        { status: 400 }
      );
    }

    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(RPC_URL),
    });

    // Get the user's balance
    const balance = (await client.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PUBLIC_TERMINAL_ABI,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    })) as bigint;

    if (balance === 0n) {
      return NextResponse.json(
        { error: "User has no tokens" },
        { status: 404 }
      );
    }

    // Simple fallback: return token 1 if it exists
    // In production, you should add ownerOf() to the contract ABI
    // and check actual token ownership
    const tokenId = "1";

    return NextResponse.json(
      { tokenId },
      {
        headers: {
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching user token:", error);
    return NextResponse.json(
      { error: "Failed to fetch user token" },
      { status: 500 }
    );
  }
}
