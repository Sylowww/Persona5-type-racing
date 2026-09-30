import Image from "next/image";
import { Icon } from "@/components/ui/icon";

type PlayerAvatarProps = {
  avatarUrl: string | null;
  alt: string;
  /** In pixels. */
  size: number;
  className?: string;
};

/** Provider avatar when there is one, otherwise the placeholder silhouette. */
export function PlayerAvatar({ avatarUrl, alt, size, className = "" }: PlayerAvatarProps) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-primary-container ${className}`}
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt={alt} width={size} height={size} className="size-full object-cover" />
      ) : (
        <div role="img" aria-label={alt} className="flex size-full items-center justify-center">
          <Icon name="person" filled size={Math.round(size * 0.66)} className="text-on-primary-container" />
        </div>
      )}
    </div>
  );
}
