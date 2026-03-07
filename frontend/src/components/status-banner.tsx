"use client";

import { AlertCircleIcon, CircleCheckBigIcon, InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type StatusTone = "error" | "success" | "info";

const toneMap = {
  error: {
    icon: AlertCircleIcon,
    title: "문제가 발생했습니다",
    variant: "destructive" as const,
  },
  success: {
    icon: CircleCheckBigIcon,
    title: "처리가 완료되었습니다",
    variant: "default" as const,
  },
  info: {
    icon: InfoIcon,
    title: "안내",
    variant: "default" as const,
  },
};

type StatusBannerProps = {
  message?: string;
  title?: string;
  tone?: StatusTone;
  className?: string;
};

export function StatusBanner({
  message,
  title,
  tone = "info",
  className,
}: StatusBannerProps) {
  if (!message) {
    return null;
  }

  const config = toneMap[tone];
  const Icon = config.icon;

  return (
    <Alert
      variant={config.variant}
      className={cn(
        "border-white/80 bg-white/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4" />
      <AlertTitle>{title ?? config.title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
