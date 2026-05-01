import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Agent registry | Arells",
  description:
    "Open agents that published a verified Arells opt-in — ingested automatically from their well-known URL.",
};

export default function AgentsLayout({ children }: { children: ReactNode }) {
  return children;
}
