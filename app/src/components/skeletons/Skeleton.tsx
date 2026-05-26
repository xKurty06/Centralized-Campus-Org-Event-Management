import type { CSSProperties, HTMLAttributes } from "react";

type SkeletonRadius = "sm" | "md" | "lg" | "xl" | "full";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  radius?: SkeletonRadius;
}

const radiusClass: Record<SkeletonRadius, string> = {
  sm: "rounded",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

export function Skeleton({
  width,
  height,
  radius = "md",
  className = "",
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden bg-[var(--color-surface-2)] before:absolute before:inset-0 before:-translate-x-full before:animate-[skeleton-shimmer_1.4s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent ${radiusClass[radius]} ${className}`}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={index === 0 ? 14 : 12}
          width={index === lines - 1 && lines > 1 ? "72%" : "100%"}
          radius="sm"
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 40, className = "" }: { size?: number; className?: string }) {
  return <Skeleton width={size} height={size} radius="full" className={`shrink-0 ${className}`} />;
}
