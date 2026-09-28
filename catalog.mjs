// The templates the switcher lists, in select order. Paths are relative to this folder.
// `dev` overrides the start command for an app that needs one; `{port}` is filled in.
// Otherwise it is inferred from package.json: Next.js or Vite.
// `path` is the page the frame opens, for an app whose root is a landing page.
// Descriptions are the repo's own GitHub description or README line, not ours.

export const REPOS = [
  {
    group: "Admin apps",
    id: "kiranism-dashboard",
    name: "Next Shadcn Dashboard (Kiranism)",
    dir: "../next-shadcn-dashboard-starter",
    description: "Tables, forms, auth, organisations and billing that work end to end. Auth is Clerk.",
    demo: "https://dub.sh/shadcn-dashboard",
  },
  {
    group: "Admin apps",
    id: "studio-admin",
    name: "Studio Admin (arhamkhnz)",
    dir: "../next-shadcn-admin-dashboard",
    description: "Modern Admin Dashboard Template built with Shadcn UI and Next.js 16.",
    demo: "https://studio-admin.arhamkhnz.com",
    path: "/dashboard/default",
  },
  {
    group: "Admin apps",
    id: "shadcn-admin",
    name: "Shadcn Admin (satnaing)",
    dir: "../shadcn-admin",
    description: "Admin Dashboard UI built with Shadcn and Vite.",
    demo: "https://shadcn-admin.netlify.app/",
  },
  {
    group: "Admin apps",
    id: "atomic-crm",
    name: "Atomic CRM (demo data)",
    dir: "../atomic-crm",
    description: "A full-featured CRM built with React, shadcn/ui, and Supabase. Runs here in its demo mode.",
    demo: "http://marmelab.com/atomic-crm/",
    dev: ["vite", "--config", "vite.demo.config", "--port", "{port}", "--strictPort"],
  },
  {
    group: "Tremor dashboards",
    id: "tremor-dashboard",
    name: "Tremor Dashboard",
    dir: "../template-dashboard",
    description: "SaaS application template from Tremor, built with Tremor Raw and Next.js.",
    demo: "https://dashboard.tremor.so",
  },
  {
    group: "Tremor dashboards",
    id: "tremor-insights",
    name: "Tremor Insights",
    dir: "../template-insights",
    description: "SaaS application template from Tremor, built with Tremor Raw and Next.js.",
    demo: "https://insights.tremor.so",
  },
  {
    group: "Tremor dashboards",
    id: "tremor-planner",
    name: "Tremor Planner",
    dir: "../template-planner",
    description: "SaaS application template from Tremor, built with Tremor and Next.js.",
    demo: "https://planner.tremor.so",
  },
];

// Every Base UI build in the Square UI clone is listed after the repos above.
export const SQUARE_UI = { group: "Square UI (single screens)", dir: "../square-ui" };
