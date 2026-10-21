import { describe, expect, it } from "vitest";
import {
  containsFrame,
  intervalWithin,
  intervalsOverlap,
  sceneBounds,
  secondsToFrames,
} from "./intervals";

describe("interval rules", () => {
  it("treats the start as inclusive and the end as exclusive", () => {
    const scene = sceneBounds(90);

    expect(containsFrame(scene, 0)).toBe(true);
    expect(containsFrame(scene, 89)).toBe(true);
    expect(containsFrame(scene, 90)).toBe(false);
    expect(intervalWithin({ startFrame: 0, endFrame: 90 }, scene)).toBe(true);
    expect(intervalWithin({ startFrame: 80, endFrame: 91 }, scene)).toBe(false);
  });

  it("does not treat touching ranges as overlapping", () => {
    expect(
      intervalsOverlap(
        { startFrame: 0, endFrame: 10 },
        { startFrame: 10, endFrame: 20 },
      ),
    ).toBe(false);
    expect(
      intervalsOverlap(
        { startFrame: 0, endFrame: 11 },
        { startFrame: 10, endFrame: 20 },
      ),
    ).toBe(true);
  });

  it("rounds seconds times fps once", () => {
    expect(secondsToFrames(2, 30)).toBe(60);
    expect(secondsToFrames(1 / 30, 30)).toBe(1);

    const halfFrame = 0.5 / 30;
    expect(
      secondsToFrames(halfFrame, 30) + secondsToFrames(halfFrame, 30),
    ).toBe(2);
    expect(secondsToFrames(halfFrame + halfFrame, 30)).toBe(1);
  });

  it("rejects durations and frame rates that cannot convert", () => {
    expect(() => secondsToFrames(-1, 30)).toThrow(RangeError);
    expect(() => secondsToFrames(Number.POSITIVE_INFINITY, 30)).toThrow(
      RangeError,
    );
    expect(() => secondsToFrames(1, 0)).toThrow(RangeError);
    expect(() => secondsToFrames(1, 29.97)).toThrow(RangeError);
  });
});
