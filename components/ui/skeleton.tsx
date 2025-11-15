import { cn } from "@/lib/utils/cn";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Skeleton loading component
 * Shows a pulsing placeholder while content loads
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-background-secondary",
        className
      )}
      {...props}
    />
  );
}

/**
 * Card skeleton for loading states
 */
export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-background-secondary bg-background-secondary p-6 space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

/**
 * Table row skeleton
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex gap-4 p-4 border-b border-background-secondary">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}
