import { mkdir } from "node:fs/promises";
import path from "node:path";
import { renderStill } from "@remotion/renderer";
import { resolveVideoMetadata } from "../engine";
import { requireVideo } from "../videos";
import { assertFrameInRange, parseStillOptions } from "./options";
import { openComposition } from "./open-composition";
import { projectRoot } from "./paths";

async function main(): Promise<void> {
  const options = parseStillOptions(process.argv.slice(2), {
    cwd: process.cwd(),
    projectRoot,
  });
  const video = requireVideo(options.videoId);
  assertFrameInRange(
    options.frame,
    resolveVideoMetadata(video).durationInFrames,
  );

  const opened = await openComposition(options.videoId, options.theme);
  try {
    await mkdir(path.dirname(options.outputPath), { recursive: true });
    console.log(
      `Writing frame ${String(options.frame)} to ${options.outputPath}`,
    );
    await renderStill({
      composition: opened.composition,
      serveUrl: opened.serveUrl,
      frame: options.frame,
      imageFormat: "png",
      overwrite: true,
      port: opened.port,
      inputProps: opened.inputProps,
      output: options.outputPath,
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
