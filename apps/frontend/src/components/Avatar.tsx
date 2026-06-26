import { useState } from "react";
import { getAvatarGradient, getInitials, resolvePhotoUrl } from "../lib/photo";

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  size?: string;
  textSize?: string;
  className?: string;
}

export const Avatar = ({
  firstName,
  lastName,
  photoUrl,
  size = "w-12 h-12",
  textSize = "text-base",
  className = "",
}: AvatarProps) => {
  const [errored, setErrored] = useState(false);
  const resolved = resolvePhotoUrl(photoUrl);
  const showImage = Boolean(resolved) && !errored;

  return (
    <div
      className={`${size} ${className} flex items-center justify-center overflow-hidden rounded-full`}
    >
      {showImage ? (
        <img
          src={resolved}
          alt={`${firstName ?? ""} ${lastName ?? ""}`.trim() || "User avatar"}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getAvatarGradient(
            `${firstName ?? ""}${lastName ?? ""}`,
          )} font-semibold text-white ${textSize}`}
        >
          {getInitials(firstName, lastName)}
        </div>
      )}
    </div>
  );
};
