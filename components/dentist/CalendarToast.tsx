"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CalendarToast({ status }: { status: string | undefined }) {
  const router = useRouter();

  useEffect(() => {
    if (status === "connected") {
      toast.success("Google Calendar connected successfully");
    } else if (status === "error") {
      toast.error("Failed to connect Google Calendar");
    }
    if (status) {
      // Remove the query param without a full reload
      const url = new URL(window.location.href);
      url.searchParams.delete("cal");
      router.replace(url.pathname);
    }
  }, [status, router]);

  return null;
}
