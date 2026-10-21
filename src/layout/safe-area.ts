/**
 * Layout padding for every composition. The preview overlay reads this same
 * object. Compositions do not draw the guide rectangle.
 */
export const safeAreaInsets = {
  left: 90,
  right: 180,
  top: 160,
  bottom: 300,
} as const;

export type SafeAreaInsets = typeof safeAreaInsets;

/** Fixed slots shared by the scene frame and the diagram canvas math. */
export const sceneChrome = {
  gap: 28,
  captionSlot: 188,
  consoleSlot: 112,
  titleSlot: 168,
} as const;

export function contentBox(
  frameWidth: number,
  frameHeight: number,
): { width: number; height: number } {
  return {
    width: frameWidth - safeAreaInsets.left - safeAreaInsets.right,
    height: frameHeight - safeAreaInsets.top - safeAreaInsets.bottom,
  };
}

export function sceneChromeHeight(options: {
  caption: boolean;
  console: boolean;
}): number {
  let height = 0;
  let slots = 0;
  if (options.console) {
    height += sceneChrome.consoleSlot;
    slots += 1;
  }
  if (options.caption) {
    height += sceneChrome.captionSlot;
    slots += 1;
  }
  if (slots > 0) {
    height += sceneChrome.gap * slots;
  }
  return height;
}

export function diagramCanvasSize(options: {
  frameWidth: number;
  frameHeight: number;
  title: boolean;
  caption: boolean;
  console: boolean;
}): { width: number; height: number } {
  const box = contentBox(options.frameWidth, options.frameHeight);
  const chrome = sceneChromeHeight({
    caption: options.caption,
    console: options.console,
  });
  const title = options.title ? sceneChrome.titleSlot + sceneChrome.gap : 0;
  return {
    width: box.width,
    height: Math.max(0, box.height - chrome - title),
  };
}
