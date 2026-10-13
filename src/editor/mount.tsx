import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";

/** Mounts the editor in `#root`. */
export function mountEditor(): void {
  createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
