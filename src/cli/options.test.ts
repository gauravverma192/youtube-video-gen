import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CliUsageError,
  RENDER_USAGE,
  assertFrameInRange,
  isInsideDirectory,
  parseRenderOptions,
  parseStillOptions,
} from "./options";

const context = {
  cwd: path.resolve("/work/youtube-video-gen"),
  projectRoot: path.resolve("/work/youtube-video-gen"),
};

describe("render options", () => {
  it("defaults the mp4 to out/<id>-<theme>.mp4", () => {
    expect(
      parseRenderOptions(["--video=event-loop", "--theme=dark"], context),
    ).toEqual({
      videoId: "event-loop",
      theme: "dark",
      outputPath: path.join(context.cwd, "out", "event-loop-dark.mp4"),
    });
  });

  it("accepts an explicit mp4 and a spaced theme flag", () => {
    expect(
      parseRenderOptions(
        ["--video", "starter", "--theme", "light", "--out=custom/light.mp4"],
        context,
      ).outputPath,
    ).toBe(path.join(context.cwd, "custom", "light.mp4"));
  });

  it("rejects a still frame, a bad theme, and a non-mp4 path", () => {
    expect(() =>
      parseRenderOptions(
        ["--video=event-loop", "--theme=dark", "--frame=1"],
        context,
      ),
    ).toThrow(CliUsageError);
    expect(() =>
      parseRenderOptions(["--video=event-loop", "--theme=dim"], context),
    ).toThrow(/Theme must be "light" or "dark"/);
    expect(() =>
      parseRenderOptions(
        ["--video=event-loop", "--theme=dark", "--out=out/frame.png"],
        context,
      ),
    ).toThrow(/\.mp4/);
  });
});

describe("still options", () => {
  it("defaults the png to out/<id>-<theme>-<frame>.png", () => {
    expect(
      parseStillOptions(
        ["--video=event-loop", "--theme=dark", "--frame=450"],
        context,
      ),
    ).toEqual({
      videoId: "event-loop",
      theme: "dark",
      frame: 450,
      outputPath: path.join(context.cwd, "out", "event-loop-dark-450.png"),
    });
  });

  it("rejects a missing frame and a fractional frame", () => {
    expect(() =>
      parseStillOptions(["--video=event-loop", "--theme=light"], context),
    ).toThrow(/Missing --frame/);
    expect(() =>
      parseStillOptions(
        ["--video=event-loop", "--theme=light", "--frame=1.5"],
        context,
      ),
    ).toThrow(/non-negative integer/);
  });
});

describe("output location", () => {
  it("refuses to write under src, including a normalized escape", () => {
    expect(() =>
      parseRenderOptions(
        ["--video=event-loop", "--theme=dark", "--out=src/event-loop.mp4"],
        context,
      ),
    ).toThrow(/Refusing to write under src/);

    expect(() =>
      parseRenderOptions(
        [
          "--video=event-loop",
          "--theme=dark",
          "--out=out/../src/nested/event-loop.mp4",
        ],
        context,
      ),
    ).toThrow(/Refusing to write under src/);

    expect(() =>
      parseStillOptions(
        [
          "--video=event-loop",
          "--theme=dark",
          "--frame=0",
          "--out=SRC/frame.png",
        ],
        context,
      ),
    ).toThrow(/Refusing to write under src/);
  });

  it("allows out/ even when the relative path mentions src as a prefix", () => {
    const outputPath = parseRenderOptions(
      ["--video=event-loop", "--theme=dark", "--out=out/src-notes.mp4"],
      context,
    ).outputPath;
    expect(outputPath).toBe(path.join(context.cwd, "out", "src-notes.mp4"));
    expect(isInsideDirectory(path.join(context.projectRoot, "src"), outputPath)).toBe(
      false,
    );
  });

  it("prints usage when a flag is repeated or missing", () => {
    expect(() =>
      parseRenderOptions(
        ["--video=event-loop", "--video=starter", "--theme=dark"],
        context,
      ),
    ).toThrow(RENDER_USAGE);
    expect(() => parseRenderOptions(["--theme=dark"], context)).toThrow(
      /Missing --video/,
    );
  });
});

describe("frame range", () => {
  it("accepts the last frame and rejects the duration", () => {
    expect(() => assertFrameInRange(839, 840)).not.toThrow();
    expect(() => assertFrameInRange(840, 840)).toThrow(/outside this video/);
  });
});
