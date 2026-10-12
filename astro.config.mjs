import { defineConfig } from "astro/config";

// Production address. Canonical, hreflang, og:url and the sitemap are built from it;
// override with SITE_URL for a staging host.
export default defineConfig({
  site: process.env.SITE_URL || "https://oldstreet.handyla.co",
  trailingSlash: "always",
  build: { inlineStylesheets: "auto" },
  compressHTML: true,
});
