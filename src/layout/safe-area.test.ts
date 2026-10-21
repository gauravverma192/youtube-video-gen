import { describe, expect, it } from "vitest";
import {
  contentBox,
  diagramCanvasSize,
  safeAreaInsets,
  sceneChrome,
  sceneChromeHeight,
} from "./safe-area";

describe("safe area", () => {
  it("uses the short insets", () => {
    expect(safeAreaInsets).toEqual({
      left: 90,
      right: 180,
      top: 160,
      bottom: 300,
    });
  });

  it("pads a 1080x1920 frame down to the content box", () => {
    expect(contentBox(1080, 1920)).toEqual({ width: 810, height: 1460 });
  });

  it("reserves a gap only for slots that exist", () => {
    expect(sceneChromeHeight({ caption: false, console: false })).toBe(0);
    expect(sceneChromeHeight({ caption: true, console: false })).toBe(
      sceneChrome.captionSlot + sceneChrome.gap,
    );
    expect(sceneChromeHeight({ caption: true, console: true })).toBe(
      sceneChrome.captionSlot +
        sceneChrome.consoleSlot +
        sceneChrome.gap * 2,
    );
  });

  it("leaves the diagram the space under the title and caption", () => {
    expect(
      diagramCanvasSize({
        frameWidth: 1080,
        frameHeight: 1920,
        title: true,
        caption: true,
        console: false,
      }),
    ).toEqual({
      width: 810,
      height:
        1460 -
        (sceneChrome.captionSlot + sceneChrome.gap) -
        (sceneChrome.titleSlot + sceneChrome.gap),
    });
  });
});
