"use client";

import { LeadProvider } from "@/lib/lead-store";

export function Providers({ children }: { children: React.ReactNode }) {
  return <LeadProvider>{children}</LeadProvider>;
}
