import { rm } from "node:fs/promises";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { selectComposition } from "@remotion/renderer";
import type { VideoConfig } from "remotion";
import { resolveVideoMetadata } from "../engine";
import type { ThemeId, VideoInputProps } from "../engine";
import { requireVideo } from "../videos";
import { compositionEntry, projectRoot } from "./paths";

/** Outside Studio's 3000–3100 range so a running Studio is not reused. */
const RENDER_PORT = 45321;

export type OpenedComposition = {
  serveUrl: string;
  inputProps: VideoInputProps;
  composition: VideoConfig;
  port: number;
  close: () => Promise<void>;
};

/** Bundle the Studio root and select one registry composition. */
export async function openComposition(
  videoId: string,
  theme: ThemeId,
): Promise<OpenedComposition> {
  const video = requireVideo(videoId);
  const inputProps: VideoInputProps = { theme };
  const expected = resolveVideoMetadata(video);

  let reported = -1;
  console.log(`Bundling ${video.id} (${theme})`);
  const serveUrl = await bundle({
    entryPoint: compositionEntry,
    rspack: true,
    onProgress: (progress) => {
      const percent = Math.round(progress > 1 ? progress : progress * 100);
      if (percent === reported) {
        return;
      }
      reported = percent;
      console.log(`Bundling ${String(percent)}%`);
    },
  });

  try {
    const composition = await selectComposition({
      serveUrl,
      id: video.id,
      inputProps,
      port: RENDER_PORT,
    });
    if (
      composition.width !== expected.width ||
      composition.height !== expected.height ||
      composition.fps !== expected.fps ||
      composition.durationInFrames !== expected.durationInFrames
    ) {
      throw new Error(
        `Composition "${composition.id}" resolved to ${String(composition.width)}×${String(composition.height)}, ${String(composition.fps)} fps, ${String(composition.durationInFrames)} frames. Expected ${String(expected.width)}×${String(expected.height)}, ${String(expected.fps)} fps, ${String(expected.durationInFrames)} frames.`,
      );
    }
    console.log(
      `Selected ${composition.id} ${String(composition.width)}×${String(composition.height)} at ${String(composition.fps)} fps, ${String(composition.durationInFrames)} frames`,
    );
    return {
      serveUrl,
      inputProps,
      composition,
      port: RENDER_PORT,
      close: () => removeBundle(serveUrl),
    };
  } catch (error) {
    await removeBundle(serveUrl);
    throw error;
  }
}

async function removeBundle(serveUrl: string): Promise<void> {
  const resolved = path.resolve(serveUrl);
  if (resolved === projectRoot || isInsideProjectSrc(resolved)) {
    return;
  }
  await rm(resolved, { recursive: true, force: true });
}

function isInsideProjectSrc(candidate: string): boolean {
  const srcDir = path.resolve(projectRoot, "src");
  const relative = path.relative(srcDir, candidate);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}
