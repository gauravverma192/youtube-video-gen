import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { compositionEntry, projectRoot } from "./paths";

describe("project paths", () => {
  it("resolves the studio entry from this package", () => {
    expect(path.basename(projectRoot)).toBe("youtube-video-gen");
    expect(existsSync(compositionEntry)).toBe(true);
  });
});
