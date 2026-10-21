import { describe, expect, it } from "vitest";
import { consoleAtFrame, finalConsoleOrder } from "./console";
import { parseVideoDefinition } from "./validate";

const eventLoop = parseVideoDefinition({
  schemaVersion: 1,
  id: "event-loop",
  title: "Which runs first: Promise or setTimeout?",
  description: "Browser event loop",
  width: 1080,
  height: 1920,
  fps: 30,
  defaultTheme: "dark",
  scenes: [
    {
      id: "hook",
      type: "hook",
      durationInFrames: 90,
      title: "Which runs first: Promise or setTimeout?",
    },
    {
      id: "code",
      type: "code-walkthrough",
      durationInFrames: 120,
      code: "console.log('A');",
    },
    {
      id: "sync",
      type: "code-walkthrough",
      durationInFrames: 240,
      code: "console.log('A');",
      console: [
        { id: "a", values: ["A"], startFrame: 0, endFrame: 120 },
        { id: "ad", values: ["A", "D"], startFrame: 120, endFrame: 240 },
      ],
    },
    {
      id: "microtask",
      type: "diagram",
      durationInFrames: 180,
      nodes: [{ id: "call-stack", label: "Call stack" }],
      console: [
        { id: "adc", values: ["A", "D", "C"], startFrame: 120, endFrame: 180 },
      ],
    },
    {
      id: "timer",
      type: "diagram",
      durationInFrames: 120,
      nodes: [{ id: "call-stack", label: "Call stack" }],
      console: [
        {
          id: "adcb",
          values: ["A", "D", "C", "B"],
          startFrame: 60,
          endFrame: 120,
        },
      ],
    },
    {
      id: "takeaway",
      type: "takeaway",
      durationInFrames: 90,
      sequence: ["A", "D", "C", "B"],
      sentence:
        "Microtasks run after synchronous code and before the next task.",
    },
  ],
});

describe("console order", () => {
  it("ends on A, D, C, B", () => {
    expect(finalConsoleOrder(eventLoop)).toEqual(["A", "D", "C", "B"]);
  });

  it("reveals each print at the scene-local cue, mapped through the timeline", () => {
    expect(consoleAtFrame(eventLoop, 0)).toEqual([]);
    expect(consoleAtFrame(eventLoop, 210)).toEqual(["A"]);
    expect(consoleAtFrame(eventLoop, 329)).toEqual(["A"]);
    expect(consoleAtFrame(eventLoop, 330)).toEqual(["A", "D"]);
    expect(consoleAtFrame(eventLoop, 570)).toEqual(["A", "D", "C"]);
    expect(consoleAtFrame(eventLoop, 690)).toEqual(["A", "D", "C", "B"]);
    expect(consoleAtFrame(eventLoop, 749)).toEqual(["A", "D", "C", "B"]);
    expect(consoleAtFrame(eventLoop, 750)).toEqual([]);
  });
});
