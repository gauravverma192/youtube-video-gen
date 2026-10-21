/**
 * Ranges are half-open. `startFrame` is inclusive and `endFrame` is exclusive.
 * A scene of 90 frames occupies local frames 0 through 89.
 */

export type FrameInterval = {
  startFrame: number;
  endFrame: number;
};

export function sceneBounds(durationInFrames: number): FrameInterval {
  return { startFrame: 0, endFrame: durationInFrames };
}

export function containsFrame(interval: FrameInterval, frame: number): boolean {
  return frame >= interval.startFrame && frame < interval.endFrame;
}

export function intervalsOverlap(
  left: FrameInterval,
  right: FrameInterval,
): boolean {
  return left.startFrame < right.endFrame && right.startFrame < left.endFrame;
}

export function intervalWithin(
  inner: FrameInterval,
  outer: FrameInterval,
): boolean {
  return (
    inner.startFrame >= outer.startFrame && inner.endFrame <= outer.endFrame
  );
}

export function intervalsAtFrame<T extends FrameInterval>(
  intervals: readonly T[],
  frame: number,
): T[] {
  const active: T[] = [];
  for (const interval of intervals) {
    if (containsFrame(interval, frame)) {
      active.push(interval);
    }
  }
  return active;
}

/**
 * Convert seconds to frames by rounding `seconds * fps` once.
 * Callers should convert a whole span in one call. Rounding each piece and
 * then adding the results is a different number.
 */
export function secondsToFrames(seconds: number, fps: number): number {
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new RangeError(
      "seconds must be a finite number greater than or equal to 0",
    );
  }
  if (!Number.isInteger(fps) || fps <= 0) {
    throw new RangeError("fps must be a positive integer");
  }
  return Math.round(seconds * fps);
}
