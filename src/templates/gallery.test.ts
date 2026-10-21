import { describe, expect, it } from "vitest";
import { resolveVideoMetadata } from "../engine";
import { templateGalleryVideo } from "./gallery";

describe("template gallery", () => {
  it("uses every scene template at short size", () => {
    expect(templateGalleryVideo.scenes.map((scene) => scene.type)).toEqual([
      "hook",
      "code-walkthrough",
      "diagram",
      "takeaway",
      "text-and-icon",
    ]);
    expect(resolveVideoMetadata(templateGalleryVideo)).toEqual({
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: 465,
    });
  });
});
