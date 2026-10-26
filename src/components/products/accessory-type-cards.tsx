import Link from "next/link";
import { CircuitBoard, Zap, PanelsTopLeft } from "lucide-react";

// Informational enquiry cards, not inventory or claims of availability.
const accessoryTypes = [
  {
    name: "LED Modules",
    description:
      "Explore display modules and enquire about the right fit for your LED screen.",
    icon: PanelsTopLeft,
  },
  {
    name: "Power Supplies",
    description:
      "Ask about stable power options compatible with your LED display.",
    icon: Zap,
  },
  {
    name: "Receiving Cards & Controllers",
    description:
      "Ask about control components compatible with your existing LED display system.",
    icon: CircuitBoard,
  },
];

export function AccessoryTypeCards() {
  return (
    <div className="mt-7 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {accessoryTypes.map(({ name, description, icon: Icon }) => (
        <article
          key={name}
          className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="bg-brand-900 flex aspect-[4/3] items-center justify-center text-white">
            <Icon size={76} strokeWidth={1.3} aria-hidden="true" />
          </div>
          <div className="flex flex-1 flex-col p-5">
            <p className="text-brand-700 text-xs font-bold tracking-wide uppercase">
              Accessory type
            </p>
            <h3 className="mt-2 text-lg font-bold">{name}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {description}
            </p>
            <Link href="/accessories" className="mt-auto block pt-5">
              <span className="block rounded-lg bg-[#DD2421] px-4 py-2.5 text-center font-bold text-white">
                Read More
              </span>
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
