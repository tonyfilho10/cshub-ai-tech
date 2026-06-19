import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-xs",
  lg: "h-16 w-16 text-lg",
};

export function UserAvatar({
  name,
  avatarUrl,
  size = "md",
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (avatarUrl) {
    return (
      <div className={cn("shrink-0 overflow-hidden rounded-lg", sizes[size], className)}>
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-lg bg-[#16294a] font-bold text-white", sizes[size], className)}>
      {initials}
    </div>
  );
}
