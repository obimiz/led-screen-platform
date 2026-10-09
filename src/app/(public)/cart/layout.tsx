import type { ReactNode } from "react";
import { getRobotsMetadata } from "@/lib/seo/metadata";
export const metadata = {
  robots: getRobotsMetadata({ index: false, follow: true }),
  alternates: { canonical: null },
};
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
