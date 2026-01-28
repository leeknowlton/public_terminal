"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProfileContent } from "~/components/profile/ProfileContent";

export default function ProfilePage() {
  const params = useParams();
  const fid = params?.fid ? parseInt(params.fid as string) : null;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !fid) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner h-8 w-8 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return <ProfileContent fid={fid} />;
}
