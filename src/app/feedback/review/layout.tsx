import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Feedback Review | OmniMediaTrak",
  robots: { index: false, follow: false },
};

export default function FeedbackReviewLayout({ children }: { children: ReactNode }) {
  return children;
}
