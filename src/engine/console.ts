import { containsFrame } from "./intervals";
import type { VideoDefinition } from "./schema";
import { buildTimeline, sceneAtFrame } from "./timeline";

/** Console tokens visible at a global frame. Empty when no cue covers that frame. */
export function consoleAtFrame(
  video: VideoDefinition,
  frame: number,
): readonly string[] {
  const timeline = buildTimeline(video.scenes);
  const entry = sceneAtFrame(timeline, frame);
  if (!entry) {
    return [];
  }
  const scene = video.scenes[entry.index];
  if (!scene) {
    return [];
  }
  const local = frame - entry.startFrame;
  for (const cue of scene.console) {
    if (containsFrame(cue, local)) {
      return cue.values.slice();
    }
  }
  return [];
}

/**
 * Tokens from the console cue that finishes last on the timeline.
 * Cues store the full output so far, so this is the final printed order.
 */
export function finalConsoleOrder(video: VideoDefinition): readonly string[] {
  const timeline = buildTimeline(video.scenes);
  let best: { endFrame: number; values: readonly string[] } | null = null;

  for (let index = 0; index < video.scenes.length; index++) {
    const scene = video.scenes[index];
    const entry = timeline.scenes[index];
    if (!scene || !entry) {
      continue;
    }
    for (const cue of scene.console) {
      const endFrame = entry.startFrame + cue.endFrame;
      if (!best || endFrame >= best.endFrame) {
        best = { endFrame, values: cue.values };
      }
    }
  }

  return best ? best.values.slice() : [];
}
