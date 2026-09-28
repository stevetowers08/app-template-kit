// The templates the switcher lists, in select order. Paths are relative to this folder.
// `dev` overrides the start command for an app that needs one; `{port}` is filled in.
// Otherwise it is inferred from package.json: Next.js or Vite.
// `path` is the page the frame opens, for an app whose root is a landing page.
// Descriptions are the repo's own GitHub description or README line, not ours.

export const APPS = [
  {
    id: "studio-admin",
    name: "Studio Admin",
    dir: "../studio-admin-baseui",
    description: "Modern Admin Dashboard Template built with Shadcn UI on Base UI and Next.js 16.",
    demo: "https://studio-admin.arhamkhnz.com",
    path: "/dashboard/default",
  },
  {
    id: "shadcn-admin",
    name: "Shadcn Admin",
    dir: "../shadcn-admin",
    description: "Admin Dashboard UI built with Shadcn and Vite.",
    demo: "https://shadcn-admin.netlify.app/",
  },
  {
    id: "atomic-crm",
    name: "Atomic CRM (demo data)",
    dir: "../atomic-crm",
    description: "A full-featured CRM built with React, shadcn/ui, and Supabase. Runs here in its demo mode.",
    demo: "http://marmelab.com/atomic-crm/",
    dev: ["vite", "--config", "vite.demo.config", "--port", "{port}", "--strictPort"],
  },
  {
    id: "kiranism-dashboard",
    name: "Kiranism Dashboard",
    dir: "../next-shadcn-dashboard-starter",
    description: "Tables, forms, auth, organisations and billing that work end to end. Auth is Clerk.",
    demo: "https://dub.sh/shadcn-dashboard",
  },
];
