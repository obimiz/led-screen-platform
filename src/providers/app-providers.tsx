"use client";

import type { ReactNode } from "react";

import { QueryProvider } from "@/providers/query-provider";
import { CartProvider } from "@/components/cart/cart-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <QueryProvider><CartProvider>{children}</CartProvider></QueryProvider>;
}
