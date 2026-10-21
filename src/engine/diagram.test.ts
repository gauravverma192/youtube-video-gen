import { describe, expect, it } from "vitest";
import { resolveDiagramState } from "./diagram";
import type { DiagramScene } from "./schema";
import { parseVideoDefinition } from "./validate";

function parseDiagram(scene: Record<string, unknown>): DiagramScene {
  const video = parseVideoDefinition({
    schemaVersion: 1,
    id: "event-loop",
    title: "Event loop",
    description: "",
    width: 1080,
    height: 1920,
    fps: 30,
    defaultTheme: "dark",
    scenes: [scene],
  });
  const parsed = video.scenes[0];
  if (!parsed || parsed.type !== "diagram") {
    throw new Error("expected a diagram scene");
  }
  return parsed;
}

function labels(scene: DiagramScene, frame: number, nodeId: string): string[] {
  const node = resolveDiagramState(scene, frame).nodes.find(
    (candidate) => candidate.id === nodeId,
  );
  return node?.items.map((item) => item.label) ?? [];
}

const microtask = parseDiagram({
  id: "microtask",
  type: "diagram",
  durationInFrames: 180,
  title: "Browser event loop",
  nodes: [
    {
      id: "call-stack",
      label: "Call stack",
      items: [{ id: "c", label: "C", startFrame: 120, endFrame: 180 }],
    },
    {
      id: "microtask-queue",
      label: "Microtask queue",
      items: [{ id: "c", label: "C", startFrame: 60, endFrame: 120 }],
    },
  ],
  connectors: [
    { id: "queue-to-stack", from: "microtask-queue", to: "call-stack" },
  ],
  emphasis: [
    {
      id: "queued",
      startFrame: 60,
      endFrame: 120,
      targets: ["microtask-queue", "c"],
    },
    {
      id: "running",
      startFrame: 120,
      endFrame: 180,
      targets: ["call-stack", "c"],
    },
  ],
});

const timer = parseDiagram({
  id: "timer",
  type: "diagram",
  durationInFrames: 120,
  nodes: [
    {
      id: "call-stack",
      label: "Call stack",
      items: [{ id: "b", label: "B", startFrame: 60, endFrame: 120 }],
    },
    {
      id: "task-queue",
      label: "Task queue",
      items: [{ id: "b", label: "B", startFrame: 0, endFrame: 60 }],
    },
  ],
  connectors: [{ id: "task-to-stack", from: "task-queue", to: "call-stack" }],
  emphasis: [
    {
      id: "waiting",
      startFrame: 0,
      endFrame: 60,
      targets: ["task-queue", "b"],
    },
    {
      id: "running",
      startFrame: 60,
      endFrame: 120,
      targets: ["call-stack", "b"],
    },
  ],
});

describe("diagram resolver", () => {
  it("moves the promise reaction from the queue onto the stack", () => {
    expect(labels(microtask, 0, "call-stack")).toEqual([]);
    expect(labels(microtask, 59, "microtask-queue")).toEqual([]);

    const queued = resolveDiagramState(microtask, 60);
    const queue = queued.nodes.find((node) => node.id === "microtask-queue");
    const stack = queued.nodes.find((node) => node.id === "call-stack");
    expect(queue?.items.map((item) => item.label)).toEqual(["C"]);
    expect(stack?.items).toEqual([]);
    expect(queue?.emphasized).toBe(true);
    expect(queue?.items[0]?.emphasized).toBe(true);
    expect(stack?.emphasized).toBe(false);
    expect(queue?.y).toBeGreaterThan(stack?.y ?? 0);

    const running = resolveDiagramState(microtask, 120);
    const runningQueue = running.nodes.find(
      (node) => node.id === "microtask-queue",
    );
    const runningStack = running.nodes.find((node) => node.id === "call-stack");
    expect(
      runningStack?.items.map((item) => ({ label: item.label, y: item.y })),
    ).toEqual([{ label: "C", y: runningStack?.y }]);
    expect(runningQueue?.items).toEqual([]);
    expect(runningStack?.emphasized).toBe(true);
    expect(runningStack?.y).not.toBe(queue?.y);
    expect(running.connectors[0]).toMatchObject({
      fromX: runningQueue?.x,
      fromY: runningQueue?.y,
      toX: runningStack?.x,
      toY: runningStack?.y,
      emphasized: false,
    });
  });

  it("moves the timer callback onto the stack when its beat starts", () => {
    expect(labels(timer, 0, "task-queue")).toEqual(["B"]);
    expect(labels(timer, 59, "call-stack")).toEqual([]);

    const running = resolveDiagramState(timer, 60);
    expect(labels(timer, 60, "call-stack")).toEqual(["B"]);
    expect(labels(timer, 60, "task-queue")).toEqual([]);
    expect(
      running.nodes.find((node) => node.id === "call-stack")?.emphasized,
    ).toBe(true);
    expect(
      running.nodes.find((node) => node.id === "task-queue")?.emphasized,
    ).toBe(false);
  });

  it("returns the same state for the same frame", () => {
    expect(resolveDiagramState(microtask, 60)).toEqual(
      resolveDiagramState(microtask, 60),
    );
  });

  it("rejects a frame outside the scene", () => {
    expect(() => resolveDiagramState(microtask, 180)).toThrow(RangeError);
    expect(() => resolveDiagramState(microtask, -1)).toThrow(RangeError);
    expect(() => resolveDiagramState(microtask, 1.5)).toThrow(RangeError);
  });
});
