import type { ReactNode } from "react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { WhatsAppFloating } from "@/components/layout/whatsapp-floating";
import { getPublicBusinessSettings } from "@/services/business-settings";

export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  const settings = await getPublicBusinessSettings();

  return (
    <div className="flex min-h-dvh flex-col">
      <Header settings={settings} />
      <div className="flex-1">{children}</div>
      <Footer settings={settings} />
      <WhatsAppFloating number={settings.whatsappNumber} />
    </div>
  );
}
