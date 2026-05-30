import type { Metadata } from "next";
import { RedirectClient } from "./redirect-client";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function Home() {
  return <RedirectClient />;
}
