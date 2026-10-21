import { describe, expect, it } from "vitest";
import { arrowParts, connectorSegment, nodeBoxes } from "./diagram-layout";

describe("diagram layout", () => {
  const canvas = { width: 810, height: 1048 };

  function placed() {
    const boxes = nodeBoxes(
      [
        { id: "call-stack", x: 0.5, y: 0.2, itemCount: 0 },
        { id: "microtask-queue", x: 0.5, y: 0.8, itemCount: 1 },
      ],
      canvas,
    );
    const stack = boxes[0];
    const queue = boxes[1];
    if (!stack || !queue) {
      throw new Error("expected two nodes");
    }
    return { stack, queue };
  }

  it("keeps both cards inside the canvas with a gap between them", () => {
    const { stack, queue } = placed();
    for (const box of [stack, queue]) {
      expect(box.y - box.height / 2).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height / 2).toBeLessThanOrEqual(canvas.height);
      expect(box.x - box.width / 2).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width / 2).toBeLessThanOrEqual(canvas.width);
    }
    expect(stack.y + stack.height / 2).toBeLessThan(queue.y - queue.height / 2);
  });

  it("points the arrow from the lower node up toward the upper node", () => {
    const { stack, queue } = placed();
    const segment = connectorSegment(queue, stack);

    expect(segment.y2).toBeLessThan(segment.y1);
    expect(segment.y1).toBeLessThanOrEqual(queue.y);
    expect(segment.y2).toBeGreaterThanOrEqual(stack.y);

    const arrow = arrowParts(segment, 28);
    expect(arrow.y2).toBeGreaterThan(segment.y2);
  });
});
