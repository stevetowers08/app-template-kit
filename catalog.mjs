// The templates the switcher lists, in select order. `dir` is a folder inside the templates
// directory (TEMPLATES_DIR, default `templates/` beside this file); `repo` is where
// `npm run clone` gets it from.
// `dev` overrides the start command for an app that needs one; `{port}` is filled in.
// `prepare` runs once before the dev server, for an app that needs a generated file first.
// Otherwise it is inferred from package.json: Next.js or Vite.
// `path` is the page the frame opens, for an app whose root is a landing page.
// Descriptions are the repo's own GitHub description or README line, not ours.

export const APPS = [
  {
    id: "studio-admin",
    name: "Studio Admin",
    dir: "studio-admin-baseui",
    repo: "https://github.com/arhamkhnz/next-shadcn-admin-dashboard-baseui.git",
    description: "Modern Admin Dashboard Template built with Shadcn UI on Base UI and Next.js 16.",
    demo: "https://studio-admin.arhamkhnz.com",
    path: "/dashboard/default",
  },
  {
    id: "shadcn-admin",
    name: "Shadcn Admin",
    dir: "shadcn-admin",
    repo: "https://github.com/satnaing/shadcn-admin.git",
    description: "Admin Dashboard UI built with Shadcn and Vite.",
    demo: "https://shadcn-admin.netlify.app/",
  },
  {
    id: "atomic-crm",
    name: "Atomic CRM (demo data)",
    dir: "atomic-crm",
    repo: "https://github.com/marmelab/atomic-crm.git",
    description: "A full-featured CRM built with React, shadcn/ui, and Supabase. Runs here in its demo mode.",
    demo: "http://marmelab.com/atomic-crm/",
    dev: ["vite", "--config", "vite.demo.config", "--port", "{port}", "--strictPort"],
  },
  {
    id: "latent-ui",
    name: "Latent UI (in this repo)",
    dir: "latent-ui",
    local: true,
    prepare: ["tsx", "scripts/build-registry.ts"],
    description: "The surface gallery in latent-ui/: card header, stat card, table and list variants under five looks, with a copyable registry recipe.",
    path: "/",
  },
  {
    id: "kiranism-dashboard",
    name: "Kiranism Dashboard",
    dir: "next-shadcn-dashboard-starter",
    repo: "https://github.com/Kiranism/next-shadcn-dashboard-starter.git",
    description: "Tables, forms, auth, organisations and billing that work end to end. Auth is Clerk.",
    demo: "https://dub.sh/shadcn-dashboard",
  },
];
