"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { ROUND_DURATION } from "@/lib/auction/state-machine";

interface CountdownTimerProps {
  roundStartedAt: Date;
  onTimeout?: () => void;
}

/**
 * Animated countdown timer for auction rounds
 * Color changes: blue → orange → red as time runs out
 */
export function CountdownTimer({ roundStartedAt, onTimeout }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(ROUND_DURATION);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = (now.getTime() - roundStartedAt.getTime()) / 1000;
      const remaining = Math.max(0, ROUND_DURATION - elapsed);

      setTimeRemaining(Math.round(remaining));

      if (remaining === 0) {
        clearInterval(interval);
        onTimeout?.();
      }
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [roundStartedAt, onTimeout]);

  const percentage = (timeRemaining / ROUND_DURATION) * 100;

  // Color logic
  let colorClass = "bg-accent-primary"; // Blue
  let textColorClass = "text-accent-primary";

  if (percentage <= 50 && percentage > 25) {
    colorClass = "bg-orange-500"; // Orange
    textColorClass = "text-orange-500";
  } else if (percentage <= 25) {
    colorClass = "bg-accent-error"; // Red
    textColorClass = "text-accent-error";
  }

  return (
    <div className="space-y-4">
      {/* Time display */}
      <div className="text-center">
        <div className={`text-6xl font-bold font-mono ${textColorClass} transition-colors`}>
          {timeRemaining}s
        </div>
        <div className="text-sm text-text-secondary mt-2">
          Czas na decyzję
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-4 bg-background-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-100 ease-linear`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Warning message */}
      {timeRemaining <= 10 && timeRemaining > 0 && (
        <div className="text-center text-accent-error text-sm animate-pulse">
          Szybko! Pozostało tylko {timeRemaining} sekund!
        </div>
      )}
    </div>
  );
}
