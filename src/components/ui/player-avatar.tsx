import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { generatedAvatar } from "@/lib/avatar";

type PlayerAvatarProps = {
  avatarUrl: string | null;
  alt: string;
  /** In pixels. */
  size: number;
  className?: string;
  /** Without a picture, draws an avatar generated from this name instead of the silhouette (guests). */
  generateFrom?: string;
};

const TONES = [
  "bg-primary-container text-on-primary-container",
  "bg-secondary-container text-on-secondary-fixed",
  "bg-on-surface text-surface-container-lowest",
  "bg-surface-container-highest text-secondary",
];

/** Uploaded or provider picture when there is one, otherwise a generated avatar or the placeholder silhouette. */
export function PlayerAvatar({ avatarUrl, alt, size, className = "", generateFrom }: PlayerAvatarProps) {
  const generated = !avatarUrl && generateFrom ? generatedAvatar(generateFrom) : null;
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden ${generated ? TONES[generated.tone] : "bg-primary-container"} ${className}`}
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt={alt} width={size} height={size} className="size-full object-cover" />
      ) : generated ? (
        <span
          role="img"
          aria-label={alt}
          className="font-display font-black italic leading-none"
          style={{ fontSize: Math.round(size * 0.42) }}
        >
          {generated.initials}
        </span>
      ) : (
        <div role="img" aria-label={alt} className="flex size-full items-center justify-center">
          <Icon name="person" filled size={Math.round(size * 0.66)} className="text-on-primary-container" />
        </div>
      )}
    </div>
  );
}
