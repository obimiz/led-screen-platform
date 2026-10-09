import type { ReactNode } from "react";
// Sales pages read private, changing database records at request time.
export const dynamic = "force-dynamic";
export default function SalesLayout({ children }: { children: ReactNode }) {
  return children;
}
