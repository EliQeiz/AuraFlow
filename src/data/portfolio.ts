import type { ProductKey } from "../lib/productLinks";

const base = "/media/portfolio/";
export interface ShowcaseSlide {
  src: string;
  title: string;
  kind: "image" | "video";
  poster?: string;
  caption?: string;
}
export const picture = (
  file: string,
  title: string,
  caption?: string,
): ShowcaseSlide => ({
  src: `${base}${file}.webp`,
  title,
  kind: "image",
  caption,
});
export const recording = (file: string, title: string): ShowcaseSlide => ({
  src: `${base}${file}.mp4`,
  poster: `${base}${file}.webp`,
  title,
  kind: "video",
});

export const websiteDesigns = [
  picture(
    "akwaaba-house",
    "Akwaaba House / Coastal hospitality website concept",
  ),
  picture("everwell", "Everwell / Community pharmacy website concept"),
];
export const industrialDesigns = [
  picture("mining-light", "Mining / Process flow and equipment monitoring"),
  picture("takoradi-light", "Plant operations / Production control"),
  picture("smelter-light", "Aluminium / Smelter operations"),
  picture("mining-dark", "Mining / Dark workspace"),
  picture("ore-operations", "Ore processing / Operations overview"),
  picture("smelter-operations", "Aluminium / Process dashboard"),
  picture("takoradi-dark", "Plant operations / Night workspace"),
  picture("smelter-dark", "Aluminium / High-contrast workspace"),
];
export const serviceFlyers = [
  picture(
    "development-flyer",
    "AuraFlow / Web and mobile development services",
    "Service guide",
  ),
  picture(
    "research-flyer",
    "AuraFlow / Research, project and academic support",
    "Service guide",
  ),
];

export interface PortfolioProject {
  slug: string;
  title: string;
  category: string;
  description: string;
  media: ShowcaseSlide[];
  key: ProductKey;
  launchLabel: string;
  note?: string;
  accessLabel?: string;
  capabilities: string[];
  problem: string;
  role: string;
  workflows: string[];
  technologies: string[];
  safeguards: string[];
  status: string;
}

export const portfolioProjects: PortfolioProject[] = [
  {
    slug: "crestview",
    title: "Crestview",
    category: "School management",
    key: "crestview",
    description:
      "A school workspace that brings people, academics, attendance and finance together.",
    media: [
      recording("crestview", "Crestview / School operations walkthrough"),
    ],
    launchLabel: "Open school website",
    accessLabel: "School website available. Guest demo not yet released.",
    note: "The school website is public. A guest demo of the management platform is not available yet.",
    capabilities: [
      "School operations dashboard",
      "Student, staff and parent portals",
      "Attendance and academic records",
      "Finance and administration",
    ],
    problem:
      "Schools need one reliable view of people, academics, attendance and administration without forcing every role into the same workflow.",
    role: "Product strategy, interface design, full-stack development and multi-role workflow architecture.",
    workflows: [
      "Admissions and student records",
      "Attendance and academic operations",
      "Staff, parent and student workspaces",
      "Finance and school administration",
    ],
    technologies: [
      "React",
      "TypeScript",
      "Cloud data services",
      "Role-based access",
    ],
    safeguards: [
      "Role-specific workspaces",
      "Private school records",
      "Authenticated operational access",
      "Audit-ready workflow structure",
    ],
    status:
      "Public school website available; management workspace guest access is being prepared.",
  },
  {
    slug: "buildproof",
    title: "BuildProof",
    category: "Construction software",
    key: "buildproof",
    description:
      "A project command centre connecting site evidence, material records and construction workflows.",
    media: [
      recording(
        "buildproof",
        "BuildProof / Project command centre walkthrough",
      ),
    ],
    launchLabel: "Open platform",
    accessLabel: "This deployment currently requires Vercel sign-in.",
    note: "This address currently redirects to Vercel sign-in. A publicly accessible deployment is needed before guests can explore the platform without a Vercel account.",
    capabilities: [
      "Project command centre",
      "Material and supplier records",
      "Evidence and site activity",
      "Operational reporting",
    ],
    problem:
      "Construction teams need site evidence, materials and project decisions to remain connected instead of disappearing across chats and spreadsheets.",
    role: "Product design, operational workflow modelling, frontend engineering and connected project records.",
    workflows: [
      "Project command and oversight",
      "Material and supplier records",
      "Site evidence and activity",
      "Progress and operational reporting",
    ],
    technologies: ["React", "TypeScript", "Cloud workspace", "Media records"],
    safeguards: [
      "Project-scoped access",
      "Controlled evidence records",
      "Authenticated workspace entry",
      "Explicit deployment status",
    ],
    status:
      "Working deployment available; the current public address requires Vercel authentication.",
  },
  {
    slug: "edma",
    title: "EDMA Restaurant",
    category: "Restaurant website",
    key: "edma",
    description:
      "A Ghanaian restaurant brought online through a menu-first experience and a direct ordering journey.",
    media: [recording("edma", "EDMA / Restaurant website walkthrough")],
    launchLabel: "Open website",
    capabilities: [
      "Food and menu presentation",
      "Category browsing",
      "Restaurant information",
      "Ordering entry points",
    ],
    problem:
      "A local restaurant needs its food, location and ordering journey to feel immediate on mobile without losing its Ghanaian character.",
    role: "Visual direction, responsive frontend development and menu-first customer journey design.",
    workflows: [
      "Menu discovery",
      "Category browsing",
      "Restaurant story",
      "Order handoff",
    ],
    technologies: [
      "React",
      "Responsive CSS",
      "Motion design",
      "Mobile-first navigation",
    ],
    safeguards: [
      "Clear external handoffs",
      "Accessible navigation",
      "Responsive media",
      "No hidden checkout claims",
    ],
    status: "Public website available.",
  },
  {
    slug: "minat",
    title: "Minat Lounge",
    category: "Hospitality website",
    key: "minat",
    description:
      "An atmospheric digital home for food, events and evenings at the lounge.",
    media: [recording("minat", "Minat Lounge / Website walkthrough")],
    launchLabel: "Open website",
    capabilities: [
      "Venue storytelling",
      "Menu exploration",
      "Event presentation",
      "Contact and location",
    ],
    problem:
      "A hospitality venue needs one digital home that communicates its atmosphere while keeping menus, events and contact details easy to reach.",
    role: "Experience design, visual storytelling and responsive web implementation.",
    workflows: [
      "Venue discovery",
      "Menu exploration",
      "Event presentation",
      "Contact and location",
    ],
    technologies: [
      "React",
      "Responsive CSS",
      "Media-led layouts",
      "Performance-aware loading",
    ],
    safeguards: [
      "Readable contrast",
      "Keyboard navigation",
      "Clear contact paths",
      "Optimised media",
    ],
    status: "Public website available.",
  },
  {
    slug: "jollofvibes",
    title: "JollofVibes",
    category: "Food & ordering",
    key: "jollofvibes",
    description:
      "A food-led restaurant experience, with Ghanaian dishes and WhatsApp ordering at its heart.",
    media: [
      recording("jollofvibes", "JollofVibes / Restaurant website walkthrough"),
    ],
    launchLabel: "Open website",
    capabilities: [
      "Food-led landing page",
      "Menu categories",
      "WhatsApp ordering entry",
      "Restaurant details",
    ],
    problem:
      "A food brand needs customers to move from appetite to a direct order while keeping dishes, categories and essential restaurant information clear.",
    role: "Brand-led interface design, responsive implementation and WhatsApp ordering journey.",
    workflows: [
      "Dish discovery",
      "Menu categories",
      "WhatsApp order entry",
      "Restaurant information",
    ],
    technologies: [
      "React",
      "Responsive CSS",
      "Motion design",
      "WhatsApp deep links",
    ],
    safeguards: [
      "Explicit order handoff",
      "Accessible controls",
      "Responsive imagery",
      "Reduced-motion support",
    ],
    status:
      "Recorded working experience available; public launch address is not listed yet.",
  },
];

export const portfolioServices = [
  {
    id: "websites",
    title: "Premium websites",
    short: "Websites",
    color: "#006dcc",
    description:
      "Distinctive websites for businesses with something to say. Clear content, thoughtful journeys and responsive layouts.",
    features: [
      "Business and portfolio websites",
      "Restaurants, hotels and retail",
      "Responsive design and SEO foundations",
    ],
  },
  {
    id: "applications",
    title: "Web applications",
    short: "Web applications",
    color: "#6941c6",
    description:
      "Software built around the work you actually do. From school operations to project records and customer portals.",
    features: [
      "Custom business workflows",
      "Role-based workspaces",
      "Connected data and integrations",
    ],
  },
  {
    id: "mobile",
    title: "Mobile experiences",
    short: "Mobile apps",
    color: "#c65c00",
    description:
      "Purposeful mobile products, from the first user journey to a considered interface and implementation.",
    features: [
      "Mobile product design",
      "Android and iOS development",
      "Connected services and APIs",
    ],
  },
  {
    id: "data",
    title: "Data, dashboards & ML",
    short: "Data & ML",
    color: "#087b72",
    description:
      "Make complex information easier to understand, explore and act on. Built for the questions your team needs answered.",
    features: [
      "Operational and industrial dashboards",
      "Statistical analysis and visualisation",
      "Machine learning and predictive models",
    ],
  },
];
