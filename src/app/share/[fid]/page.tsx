import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { APP_URL } from "~/lib/constants";
import { getMiniAppEmbedMetadata } from "~/lib/utils";

export const revalidate = 0;

// Share page for Public_Terminal message artifacts
// URL format: /share/[tokenId]?username=xxx&text=xxx&color=xxx&total=xxx
// The OG image is generated dynamically to show the minted message
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ fid: string }>; // fid is actually tokenId in our case
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { fid: tokenId } = await params;
  const queryParams = await searchParams;

  // Extract message data from query params
  const username = typeof queryParams.username === "string" ? queryParams.username : undefined;
  const text = typeof queryParams.text === "string" ? queryParams.text : undefined;
  const color = typeof queryParams.color === "string" ? queryParams.color : undefined;
  const total = typeof queryParams.total === "string" ? queryParams.total : undefined;
  const timestamp = typeof queryParams.timestamp === "string" ? queryParams.timestamp : undefined;

  // Build OG image URL with all available params
  const ogParams = new URLSearchParams();
  ogParams.set("tokenId", tokenId);
  if (username) ogParams.set("username", username);
  if (text) ogParams.set("text", text);
  if (color) ogParams.set("color", color);
  if (total) ogParams.set("total", total);
  if (timestamp) ogParams.set("timestamp", timestamp);

  const ogImageUrl = `${APP_URL}/api/opengraph-image/transmission?${ogParams.toString()}`;
  const shareUrl = `${APP_URL}/share/${tokenId}`;

  // Build title and description based on message
  const title = username
    ? `${username} transmitted to PUBLIC_TERMINAL`
    : "New transmission on PUBLIC_TERMINAL";

  const description = text
    ? `"${text.length > 100 ? text.slice(0, 100) + "..." : text}"`
    : "A permanent on-chain text artifact. Join the conversation.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [ogImageUrl],
      url: shareUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    other: {
      "fc:frame": JSON.stringify(getMiniAppEmbedMetadata(ogImageUrl)),
    },
  };
}

export default function SharePage() {
  // Redirect to the app - the share page just serves metadata for previews
  redirect("/");
}
