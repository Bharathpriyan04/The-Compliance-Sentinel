/// <reference types="vite/client" />
/// <reference types="vite-plugin-pages/client-react" />

// Render-health beacon flags the OpenSwarm App Builder host reads off the preview.
interface Window {
  __openswarm_rendered?: boolean;
  __openswarm_render_failed?: boolean;
  __openswarm_last_error?: string;
}

// Vite injects process.env.BACKEND_ENABLED via define in vite.config.ts
declare const process: { env: { BACKEND_ENABLED?: string } };
