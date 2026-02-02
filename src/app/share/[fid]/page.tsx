import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { APP_URL } from "~/lib/constants";
import { getMiniAppEmbedMetadata } from "~/lib/utils";

export const revalidate = 0;

// Share page for Public_Terminal message artifacts
// URL format: /share/[tokenId]?total=xxx
// The OG image fetches feed context (surrounding messages) from the contract
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ fid: string }>; // fid is actually tokenId in our case
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { fid: tokenId } = await params;
  const queryParams = await searchParams;

  const total = typeof queryParams.total === "string" ? queryParams.total : undefined;
  const cacheBuster = typeof queryParams.t === "string" ? queryParams.t : Date.now().toString();

  // Build OG image URL - endpoint fetches feed context from contract
  const ogParams = new URLSearchParams();
  ogParams.set("tokenId", tokenId);
  if (total) ogParams.set("total", total);
  ogParams.set("t", cacheBuster); // Cache buster for fresh OG image

  const ogImageUrl = `${APP_URL}/api/opengraph-image/mint?${ogParams.toString()}`;
  const shareUrl = `${APP_URL}/share/${tokenId}`;

  // Generic title/description - actual content shown in OG image
  const title = "Transmission on PUBLIC_TERMINAL";
  const description = "A permanent on-chain text artifact. Join the conversation.";

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
