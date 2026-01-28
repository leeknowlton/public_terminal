"use client";

import React from "react";

interface ProfileContentProps {
  fid: number;
}

export const ProfileContent: React.FC<ProfileContentProps> = ({ fid }) => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Profile Page</h1>
        <p className="text-gray-600">FID: {fid}</p>
      </div>
    </div>
  );
};
