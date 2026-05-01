import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Verify agent | Arells",
  description:
    "Verify an agent's published opt-in signature and see what is proven about the model provider.",
};

export default function VerifyAgentLayout({ children }: { children: ReactNode }) {
  return children;
}
