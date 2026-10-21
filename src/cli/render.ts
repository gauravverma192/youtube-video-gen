import { mkdir } from "node:fs/promises";
import path from "node:path";
import { renderMedia } from "@remotion/renderer";
import { parseRenderOptions } from "./options";
import { openComposition } from "./open-composition";
import { projectRoot } from "./paths";

async function main(): Promise<void> {
  const options = parseRenderOptions(process.argv.slice(2), {
    cwd: process.cwd(),
    projectRoot,
  });
  const opened = await openComposition(options.videoId, options.theme);
  try {
    await mkdir(path.dirname(options.outputPath), { recursive: true });
    console.log(`Writing ${options.outputPath}`);
    let reported = -1;
    await renderMedia({
      composition: opened.composition,
      serveUrl: opened.serveUrl,
      codec: "h264",
      pixelFormat: "yuv420p",
      muted: true,
      overwrite: true,
      port: opened.port,
      inputProps: opened.inputProps,
      outputLocation: options.outputPath,
      onProgress: ({ progress }) => {
        const percent = Math.round(progress > 1 ? progress : progress * 100);
        if (percent === reported) {
          return;
        }
        reported = percent;
        console.log(`Rendering ${String(percent)}%`);
      },
    });
    console.log(`Wrote ${options.outputPath}`);
  } finally {
    await opened.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
