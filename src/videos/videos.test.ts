import { describe, expect, it } from "vitest";
import {
  buildTimeline,
  consoleAtFrame,
  finalConsoleOrder,
  resolveDiagramState,
  resolveVideoMetadata,
} from "../engine";
import type { DiagramScene } from "../engine";
import { eventLoopVideo } from "./event-loop";
import { getVideo, listVideos, requireVideo } from "./registry";
import { starterVideo } from "./starter";

function diagram(id: string): DiagramScene {
  const scene = eventLoopVideo.scenes.find((candidate) => candidate.id === id);
  if (!scene || scene.type !== "diagram") {
    throw new Error(`expected diagram scene "${id}"`);
  }
  return scene;
}

function itemLabels(
  scene: DiagramScene,
  frame: number,
  nodeId: string,
): string[] {
  const node = resolveDiagramState(scene, frame).nodes.find(
    (candidate) => candidate.id === nodeId,
  );
  return node?.items.map((item) => item.label) ?? [];
}

describe("event-loop video", () => {
  it("is a 1080×1920, 30 fps, 840-frame browser cut", () => {
    expect(resolveVideoMetadata(eventLoopVideo)).toEqual({
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: 840,
    });
    expect(eventLoopVideo.defaultTheme).toBe("dark");
    expect(eventLoopVideo.scenes.map((scene) => scene.type)).toEqual([
      "hook",
      "code-walkthrough",
      "code-walkthrough",
      "diagram",
      "diagram",
      "takeaway",
    ]);
    expect(
      buildTimeline(eventLoopVideo.scenes).scenes.map((scene) => [
        scene.id,
        scene.startFrame,
        scene.endFrame,
      ]),
    ).toEqual([
      ["hook", 0, 90],
      ["code", 90, 210],
      ["sync", 210, 450],
      ["microtask", 450, 630],
      ["timer", 630, 750],
      ["takeaway", 750, 840],
    ]);
  });

  it("hides the answer on the code scene, then reveals A D C B", () => {
    const code = eventLoopVideo.scenes.find((scene) => scene.id === "code");
    expect(code?.type).toBe("code-walkthrough");
    if (code?.type === "code-walkthrough") {
      expect(code.console).toEqual([]);
      expect(code.question).toBe("What order hits the console?");
    }

    expect(consoleAtFrame(eventLoopVideo, 90)).toEqual([]);
    expect(consoleAtFrame(eventLoopVideo, 209)).toEqual([]);
    expect(consoleAtFrame(eventLoopVideo, 210)).toEqual(["A"]);
    expect(consoleAtFrame(eventLoopVideo, 329)).toEqual(["A"]);
    expect(consoleAtFrame(eventLoopVideo, 330)).toEqual(["A", "D"]);
    expect(consoleAtFrame(eventLoopVideo, 569)).toEqual(["A", "D"]);
    expect(consoleAtFrame(eventLoopVideo, 570)).toEqual(["A", "D", "C"]);
    expect(consoleAtFrame(eventLoopVideo, 689)).toEqual(["A", "D", "C"]);
    expect(consoleAtFrame(eventLoopVideo, 690)).toEqual(["A", "D", "C", "B"]);
    expect(consoleAtFrame(eventLoopVideo, 749)).toEqual(["A", "D", "C", "B"]);
    expect(consoleAtFrame(eventLoopVideo, 750)).toEqual([]);
    expect(finalConsoleOrder(eventLoopVideo)).toEqual(["A", "D", "C", "B"]);
  });

  it("walks print A, the host timer, the queued microtask, then print D", () => {
    const sync = eventLoopVideo.scenes.find((scene) => scene.id === "sync");
    expect(sync?.type).toBe("code-walkthrough");
    if (sync?.type !== "code-walkthrough") {
      return;
    }
    expect(
      sync.highlights.map((beat) => [beat.lines, beat.startFrame]),
    ).toEqual([
      [[1], 0],
      [[2, 3, 4], 40],
      [[5, 6, 7], 80],
      [[8], 120],
    ]);
    expect(sync.captions.map((cue) => cue.text)).toEqual([
      "Console: A",
      "Console: A D",
    ]);
  });

  it("moves C onto the stack before B's timer task", () => {
    const microtask = diagram("microtask");
    const timer = diagram("timer");
    expect(microtask.title).toBe("Browser event loop");
    expect(timer.title).toBe("Browser event loop");
    expect(microtask.nodes.map((node) => node.label)).toEqual([
      "Call stack",
      "Microtask queue",
    ]);
    expect(timer.nodes.map((node) => node.label)).toEqual([
      "Call stack",
      "Task queue",
    ]);

    expect(itemLabels(microtask, 0, "call-stack")).toEqual([]);
    expect(itemLabels(microtask, 59, "microtask-queue")).toEqual([]);
    expect(itemLabels(microtask, 60, "microtask-queue")).toEqual(["C"]);
    expect(itemLabels(microtask, 60, "call-stack")).toEqual([]);
    expect(itemLabels(microtask, 120, "call-stack")).toEqual(["C"]);
    expect(itemLabels(microtask, 120, "microtask-queue")).toEqual([]);

    const queued = resolveDiagramState(microtask, 60);
    const running = resolveDiagramState(microtask, 120);
    expect(
      queued.nodes.find((node) => node.id === "call-stack")?.y,
    ).toBeLessThan(
      queued.nodes.find((node) => node.id === "microtask-queue")?.y ?? 0,
    );
    expect(queued.connectors[0]).toMatchObject({
      from: "microtask-queue",
      to: "call-stack",
      emphasized: false,
    });
    expect(running.connectors[0]?.emphasized).toBe(true);

    expect(itemLabels(timer, 0, "task-queue")).toEqual(["B"]);
    expect(itemLabels(timer, 59, "call-stack")).toEqual([]);
    expect(itemLabels(timer, 60, "call-stack")).toEqual(["B"]);
    expect(itemLabels(timer, 60, "task-queue")).toEqual([]);
    expect(resolveDiagramState(timer, 60).connectors[0]).toMatchObject({
      from: "task-queue",
      to: "call-stack",
      emphasized: true,
    });
  });

  it("holds A, D, C, B and the microtask sentence", () => {
    const takeaway = eventLoopVideo.scenes.find(
      (scene) => scene.id === "takeaway",
    );
    expect(takeaway).toMatchObject({
      type: "takeaway",
      sequence: ["A", "D", "C", "B"],
      sentence:
        "Microtasks run after synchronous code and before the next task.",
      console: [],
    });
  });
});

describe("starter video", () => {
  it("uses hook, text-and-icon, and takeaway only", () => {
    expect(starterVideo.id).toBe("starter");
    expect(starterVideo.scenes.map((scene) => scene.type)).toEqual([
      "hook",
      "text-and-icon",
      "takeaway",
    ]);
    expect(resolveVideoMetadata(starterVideo)).toMatchObject({
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: 270,
    });
  });
});

describe("video registry", () => {
  it("lists the event loop and the starter as selectable videos", () => {
    expect(listVideos().map((video) => video.id)).toEqual([
      "event-loop",
      "starter",
    ]);
    expect(getVideo("event-loop")).toBe(eventLoopVideo);
    expect(getVideo("starter")).toBe(starterVideo);
    expect(getVideo("missing")).toBeUndefined();
    expect(requireVideo("starter").title).toBe("Starter");
    expect(() => requireVideo("missing")).toThrow(/Unknown video "missing"/);
  });
});
