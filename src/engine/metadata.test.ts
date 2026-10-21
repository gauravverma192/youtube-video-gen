import { describe, expect, it } from "vitest";
import {
  buildPreviewProps,
  calculateVideoMetadata,
  createVideoCalculateMetadata,
  resolveVideoMetadata,
} from "./metadata";
import { parseVideoDefinition } from "./validate";

function eventLoopCutList() {
  return parseVideoDefinition({
    schemaVersion: 1,
    id: "event-loop",
    title: "Which runs first: Promise or setTimeout?",
    description: "Browser event loop",
    width: 1080,
    height: 1920,
    fps: 30,
    defaultTheme: "dark",
    scenes: [
      {
        id: "hook",
        type: "hook",
        durationInFrames: 90,
        title: "Which runs first: Promise or setTimeout?",
      },
      {
        id: "code",
        type: "code-walkthrough",
        durationInFrames: 120,
        code: "console.log('A');",
      },
      {
        id: "sync",
        type: "code-walkthrough",
        durationInFrames: 240,
        code: "console.log('A');",
      },
      {
        id: "microtask",
        type: "diagram",
        durationInFrames: 180,
        nodes: [{ id: "call-stack", label: "Call stack" }],
      },
      {
        id: "timer",
        type: "diagram",
        durationInFrames: 120,
        nodes: [{ id: "call-stack", label: "Call stack" }],
      },
      {
        id: "takeaway",
        type: "takeaway",
        durationInFrames: 90,
        sequence: ["A", "D", "C", "B"],
        sentence:
          "Microtasks run after synchronous code and before the next task.",
      },
    ],
  });
}

describe("video metadata", () => {
  it("returns 1080×1920, 30 fps, and 840 frames for the event-loop cut list", () => {
    expect(resolveVideoMetadata(eventLoopCutList())).toEqual({
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: 840,
    });
  });

  it("feeds the preview props and calculateMetadata from the same helper", () => {
    const video = eventLoopCutList();
    const metadata = resolveVideoMetadata(video);

    expect(buildPreviewProps(video)).toEqual({
      durationInFrames: metadata.durationInFrames,
      fps: metadata.fps,
      compositionWidth: metadata.width,
      compositionHeight: metadata.height,
      inputProps: { theme: "dark" },
    });
    expect(buildPreviewProps(video, "light")).toMatchObject({
      durationInFrames: metadata.durationInFrames,
      compositionWidth: metadata.width,
      compositionHeight: metadata.height,
      fps: metadata.fps,
      inputProps: { theme: "light" },
    });

    const calculated = createVideoCalculateMetadata(video)({
      props: { theme: "light" },
      defaultProps: { theme: video.defaultTheme },
      abortSignal: new AbortController().signal,
      compositionId: video.id,
      isRendering: false,
    });

    expect(calculated).toEqual(
      calculateVideoMetadata(video, { theme: "light" }),
    );
    expect(calculated).toMatchObject({
      width: metadata.width,
      height: metadata.height,
      fps: metadata.fps,
      durationInFrames: metadata.durationInFrames,
      props: { theme: "light" },
    });
  });
});
