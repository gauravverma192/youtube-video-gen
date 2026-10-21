import type { FrameInterval } from "./intervals";
import { containsFrame } from "./intervals";

export type TimelineSceneSource = {
  id: string;
  durationInFrames: number;
};

export type TimelineEntry = {
  id: string;
  index: number;
  startFrame: number;
  endFrame: number;
  durationInFrames: number;
};

export type Timeline = {
  durationInFrames: number;
  scenes: TimelineEntry[];
};

/**
 * Assigns each scene a global start frame. Scenes play in array order,
 * back to back. This is the only place those start frames are chosen.
 */
export function buildTimeline(
  scenes: readonly TimelineSceneSource[],
): Timeline {
  const entries: TimelineEntry[] = [];
  let startFrame = 0;

  for (let index = 0; index < scenes.length; index++) {
    const scene = scenes[index];
    if (
      !scene ||
      !Number.isInteger(scene.durationInFrames) ||
      scene.durationInFrames <= 0
    ) {
      const id = scene?.id ?? String(index);
      throw new RangeError(`Scene "${id}" duration must be a positive integer`);
    }

    const endFrame = startFrame + scene.durationInFrames;
    entries.push({
      id: scene.id,
      index,
      startFrame,
      endFrame,
      durationInFrames: scene.durationInFrames,
    });
    startFrame = endFrame;
  }

  return {
    durationInFrames: startFrame,
    scenes: entries,
  };
}

export function sceneAtFrame(
  timeline: Timeline,
  frame: number,
): TimelineEntry | null {
  for (const scene of timeline.scenes) {
    if (containsFrame(scene, frame)) {
      return scene;
    }
  }
  return null;
}

export function localFrame(entry: TimelineEntry, globalFrame: number): number {
  return globalFrame - entry.startFrame;
}

/** Shifts a scene-local interval by a start frame the timeline has already assigned. */
export function sceneIntervalToGlobal(
  sceneStartFrame: number,
  interval: FrameInterval,
): FrameInterval {
  return {
    startFrame: sceneStartFrame + interval.startFrame,
    endFrame: sceneStartFrame + interval.endFrame,
  };
}
