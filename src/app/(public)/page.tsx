import { ArrowRight, MonitorUp, ShieldCheck, Wrench } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/ui/container";

const capabilities = [
  {
    title: "Display solutions",
    text: "A scalable home for LED screen sales and accessories.",
    icon: MonitorUp,
  },
  {
    title: "Project delivery",
    text: "Architecture ready for rentals and professional installations.",
    icon: ShieldCheck,
  },
  {
    title: "Lifecycle support",
    text: "Prepared for maintenance, repairs, and service enquiries.",
    icon: Wrench,
  },
];

export default function HomePage() {
  return (
    <>
      <section className="overflow-hidden bg-slate-950 py-24 text-white sm:py-32">
        <Container>
          <p className="mb-5 text-sm font-bold tracking-[0.22em] text-cyan-300 uppercase">
            LED display technology
          </p>
          <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
            A dependable foundation for brilliant digital experiences.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Professional display solutions—from supply and rental to
            installation and long-term technical support.
          </p>
          <Link
            href="#solutions"
            className="mt-9 inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-300"
          >
            Explore our capabilities <ArrowRight size={18} />
          </Link>
        </Container>
      </section>
      <section id="solutions" className="py-20 sm:py-24">
        <Container>
          <div id="about" className="max-w-2xl">
            <p className="text-sm font-bold tracking-widest text-cyan-700 uppercase">
              Built for growth
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              One platform for the complete display lifecycle.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {capabilities.map(({ title, text, icon: Icon }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 p-6 shadow-sm"
              >
                <Icon className="text-cyan-600" />
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
