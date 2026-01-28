import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { Anthropic } from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET(request: Request) {
  const neynarKey = process.env.NEYNAR_API_KEY;
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid");

  if (!neynarKey || !claudeKey) {
    return NextResponse.json({ error: "Missing API keys" }, { status: 500 });
  }

  if (!fid) {
    return NextResponse.json(
      { error: "FID parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Check cache first (7 days TTL)
    const cacheKey = `interests:${fid}`;
    const cached = await kv.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for interests:${fid}`);
      return NextResponse.json(cached);
    }

    const neynar = new NeynarAPIClient({ apiKey: neynarKey });

    // Fetch user's most popular casts
    console.log(`Fetching popular casts for FID: ${fid}`);
    let castsData;
    try {
      castsData = await neynar.fetchPopularCastsByUser({
        fid: parseInt(fid),
      });
    } catch (neynarError: any) {
      console.error("Neynar API error:", {
        status: neynarError.response?.status,
        statusText: neynarError.response?.statusText,
        data: neynarError.response?.data,
      });
      // Return empty interests if we can't fetch casts
      return NextResponse.json({
        interests: [],
        message: "Unable to fetch user casts",
      });
    }

    const casts = castsData.casts || [];
    console.log(`Found ${casts.length} popular casts`);

    if (casts.length === 0) {
      const result = { interests: [], message: "No recent casts found" };
      // Cache for 7 days even with no casts
      await kv.setex(cacheKey, 604800, result);
      return NextResponse.json(result);
    }

    // Prepare cast texts for Claude
    const castTexts = casts
      .map((cast) => cast.text)
      .filter(Boolean)
      .join("\n\n");

    // Use Claude to analyze interests
    const claude = new Anthropic({
      apiKey: claudeKey,
    });

    const response = await claude.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are analyzing a Farcaster user's popular casts to identify their unique interests and obsessions.

IMPORTANT: Extract what makes THIS user SPECIFIC, not generic interests. Avoid obvious tags like "crypto", "blockchain", or "tech". Instead, dig deeper:
- What niches or sub-topics do they focus on?
- What technical domains or communities are they part of?
- What recurring themes or patterns appear across their casts?
- Are there specific projects, protocols, or personalities they mention repeatedly?
- What's their unique take or perspective on topics?
- CRITICAL: Are there any proper nouns (project names, protocols, brands, communities) that THIS USER appears to be a creator or core founder of? If yes, include these as-is with proper capitalization (e.g., "SomeProtocol", "MyBrand").

Return exactly 5 interests that are SPECIFIC to this user's actual focus areas. Keep each interest SHORT - 1-2 words max. Include crypto/Farcaster in-jokes if they genuinely reflect the user's voice (not forced). Avoid generic terms. Exclude anything related to Moxie. Be selective and only include the most relevant interests. If the user is a creator of specific projects/protocols/personalities, prioritize those proper nouns in your selection.

⚠️ CRITICAL RULES:
1. ALL interests MUST be nouns or noun phrases. Use gerunds (-ing forms) to convert actions into nouns. For example:
   ✅ CORRECT: "onchain experimentation", "degen tokenomics", "community gratitude", "GM hosting", "protocol building"
   ❌ WRONG: "GM host" (host as verb), "build protocols" (verb phrase)
2. Use spaces ONLY, never use underscores:
   ✅ CORRECT: "MyProject creator"
   ❌ WRONG: "MyProject_creator"

Format: ["specific interest1", "niche topic2", "unique focus3", "another focus4", "fifth focus5"]
(Note: comma after each interest except the last one)

Recent popular casts:
${castTexts}`,
        },
      ],
    });

    // Parse Claude's response
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Helper function to clean interest text
    const cleanInterest = (text: string): string => {
      return text
        .replace(/^["'\d.-]+/, "") // Remove quotes, numbers, dots, hyphens at start
        .replace(/["']$/g, "") // Remove trailing quotes
        .replace(/_/g, " ") // Replace underscores with spaces
        .trim();
    };

    let interests: string[] = [];
    try {
      // Try to extract JSON array first
      const jsonMatch = content.text.match(/\[.*\]/s);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          // Clean all interests even from JSON
          interests = (Array.isArray(parsed) ? parsed : [])
            .map((interest) => cleanInterest(String(interest)))
            .filter((line) => line.length > 0)
            .slice(0, 5); // Cap at 5
        } catch {
          // JSON parsing failed, try fallback
          throw new Error("JSON parse failed");
        }
      } else {
        // Fallback: Parse newline or comma-separated text
        const lines = content.text
          .split(/\n|,/)
          .map((line) => cleanInterest(line))
          .filter((line) => line.length > 0)
          .slice(0, 5); // Cap at 5

        interests = lines;
      }
    } catch (e) {
      console.error("Failed to parse Claude response:", e);
      interests = [];
    }

    const result = { interests };

    // Cache for 7 days (604,800 seconds)
    await kv.setex(cacheKey, 604800, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to generate interests:", error);
    return NextResponse.json(
      { error: "Failed to generate interests", interests: [] },
      { status: 500 }
    );
  }
}
