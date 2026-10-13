import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/800.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/caveat/400.css";
import "@fontsource/caveat/700.css";
import "@fontsource/press-start-2p/400.css";
import "./styles.css";
import { FONTS } from "./model/model.ts";

// Canvas text only uses a web font once it is loaded; ask for every family up front.
for (const family of FONTS) {
  for (const weight of [400, 600, 700, 800]) {
    document.fonts.load(`${weight} 32px "${family}"`).catch(() => {});
  }
}

// `?render` is the render-only route for headless export (010/D1): no editor is mounted.
if (new URLSearchParams(location.search).has("render")) {
  const { mountRenderPage } = await import("./export/render-page.ts");
  mountRenderPage();
} else {
  const { mountEditor } = await import("./editor/mount.tsx");
  mountEditor();
}
