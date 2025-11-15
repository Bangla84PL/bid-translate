"use client";

import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

/**
 * Dialog/Modal component
 */
export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={() => onOpenChange(false)}
      />

      {/* Content */}
      <div className="relative bg-background-secondary rounded-lg shadow-lg max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-6 pb-4", className)}>{children}</div>;
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("text-xl font-bold", className)}>{children}</h2>;
}

export function DialogDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-sm text-text-secondary mt-2", className)}>{children}</p>;
}

export function DialogContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-6 pt-4 flex justify-end gap-2", className)}>{children}</div>;
}

/**
 * Confirmation dialog hook
 */
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    description: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  const confirm = (opts: {
    title: string;
    description: string;
    confirmText?: string;
    onConfirm: () => void;
  }) => {
    setConfig(opts);
    setIsOpen(true);
  };

  const ConfirmDialog = () => {
    if (!config) return null;

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Anuluj
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              config.onConfirm();
              setIsOpen(false);
            }}
          >
            {config.confirmText || "Potwierdź"}
          </Button>
        </DialogFooter>
      </Dialog>
    );
  };

  return { confirm, ConfirmDialog };
}
