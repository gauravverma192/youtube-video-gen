import { describe, expect, it } from "vitest";
import {
  buildTimeline,
  localFrame,
  sceneAtFrame,
  sceneIntervalToGlobal,
} from "./timeline";

describe("timeline builder", () => {
  const scenes = [
    { id: "hook", durationInFrames: 90 },
    { id: "code", durationInFrames: 120 },
    { id: "sync", durationInFrames: 240 },
  ];

  it("assigns sequential global start frames", () => {
    const input = scenes.map((scene) => ({ ...scene }));
    const timeline = buildTimeline(input);

    expect(input).toEqual(scenes);
    expect(timeline.durationInFrames).toBe(450);
    expect(timeline.scenes).toEqual([
      {
        id: "hook",
        index: 0,
        startFrame: 0,
        endFrame: 90,
        durationInFrames: 90,
      },
      {
        id: "code",
        index: 1,
        startFrame: 90,
        endFrame: 210,
        durationInFrames: 120,
      },
      {
        id: "sync",
        index: 2,
        startFrame: 210,
        endFrame: 450,
        durationInFrames: 240,
      },
    ]);
  });

  it("keeps the boundary frame in the next scene", () => {
    const timeline = buildTimeline(scenes);

    expect(sceneAtFrame(timeline, 0)?.id).toBe("hook");
    expect(sceneAtFrame(timeline, 89)?.id).toBe("hook");
    expect(sceneAtFrame(timeline, 90)?.id).toBe("code");
    const code = timeline.scenes[1];
    if (!code) {
      throw new Error("missing code scene");
    }

    expect(sceneAtFrame(timeline, 209)?.id).toBe("code");
    expect(sceneAtFrame(timeline, 210)?.id).toBe("sync");
    expect(sceneAtFrame(timeline, 450)).toBeNull();
    expect(localFrame(code, 90)).toBe(0);
  });

  it("shifts scene-local cues by the start frame it already assigned", () => {
    const timeline = buildTimeline(scenes);
    const code = timeline.scenes[1];
    if (!code) {
      throw new Error("missing code scene");
    }

    expect(
      sceneIntervalToGlobal(code.startFrame, { startFrame: 0, endFrame: 30 }),
    ).toEqual({
      startFrame: 90,
      endFrame: 120,
    });
  });

  it("refuses a non-positive scene duration", () => {
    expect(() => buildTimeline([{ id: "hook", durationInFrames: 0 }])).toThrow(
      RangeError,
    );
  });
});
