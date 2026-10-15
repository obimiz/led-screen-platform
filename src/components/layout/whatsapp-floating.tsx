import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { createWhatsAppUrl } from "@/lib/utils/contact";
import { officialContact } from "@/lib/constants/contact";
export function WhatsAppFloating({
  number = officialContact.number,
}: {
  number?: string;
}) {
  const href = createWhatsAppUrl(number, officialContact.enquiryMessage);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      data-whatsapp-floating
      className="fixed z-40 grid size-14 place-items-center rounded-full bg-[#128C7E] text-white shadow-lg transition-colors hover:bg-[#075E54] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#128C7E] motion-reduce:transition-none"
      style={{
        right: "max(1rem, env(safe-area-inset-right))",
        bottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <WhatsAppIcon className="size-8" />
    </a>
  );
}
