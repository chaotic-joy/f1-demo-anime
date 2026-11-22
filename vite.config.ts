import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { refreshSnapshot } from "./scripts/fetch-f1.mjs";

// Vercel’s Vite preset runs `vite build` (not `npm run build`), so the
// snapshot refresh lives here and still runs on a zero-config deploy.
export default defineConfig(async () => {
  const preview = process.argv.includes("preview") || process.env.npm_lifecycle_event === "preview";
  if (process.env.F1_SKIP_FETCH !== "1" && !preview) {
    const result = await refreshSnapshot();
    if (result.fatal) {
      throw new Error(result.error);
    }
    if (!result.ok) {
      console.warn(`[f1] ${result.error} Using the last committed snapshot.`);
    } else {
      console.log(`[f1] ${result.summary}`);
    }
  }

  return {
    plugins: [react()],
  };
});
