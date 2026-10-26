export const homepageSectionDefaults = {
  bellHeading: "Electronic Digital Bell Systems",
  cameraHeading: "LED Screen Cameras & Live Video Solutions",
} as const;

export const defaultHomepageHeroSettings = {
  headingTwo: "",
  heading: "Professional LED Display Solutions",
  description:
    "Sales, installation, rental and maintenance of LED display systems for churches, businesses, institutions and events.",
};

export const homepageSectionFallbacks = {
  bell: "Discuss an electronic bell and alarm solution for your school, church, office or institution. Our team can help with equipment selection, installation, configuration and support.",
  camera:
    "Cameras for live video production using compatible video processors, switchers or signal conversion equipment. Ask us to confirm compatibility for your setup.",
} as const;

export const defaultHomepageServicesSettings = {
  heading: "Our Services",
  description:
    "Sales, installation, rental and maintenance of LED display systems for churches, businesses, institutions, events, restaurants and bars.",
  buttonLabel: "Request a Quote",
  buttonHref: "/request-quote",
  items: [
    {
      title: "LED Display Sales",
      description: "Choose a display around your space and audience.",
      href: "/led-screens",
    },
    {
      title: "LED Screen Installation",
      description: "Plan permanent indoor and outdoor installations.",
      href: "/led-installation",
    },
    {
      title: "LED Screen Rental",
      description: "Temporary displays for events and celebrations.",
      href: "/rent-led-screen",
    },
    {
      title: "LED Screen Maintenance",
      description: "Preventive servicing, troubleshooting and repairs.",
      href: "/led-maintenance",
    },
  ],
};

// Presentation only: keep the saved wording while removing list-style prefixes.
export function formatHeroCopy(text: string) {
  return text.replace(/^[\t ]*[-–—]+[\t ]*/gm, "");
}
