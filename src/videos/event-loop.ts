import { SCHEMA_VERSION, parseVideoDefinition } from "../engine";
import type { VideoDefinitionInput } from "../engine";

/**
 * 28 seconds at 30 fps. Beats are scene-local frames; the timeline assigns
 * global starts. Sources and the claims this film is allowed to make live in
 * event-loop.md, not on screen.
 */
const snippet = [
  'console.log("A");',
  "setTimeout(() => {",
  '  console.log("B");',
  "}, 0);",
  "Promise.resolve().then(() => {",
  '  console.log("C");',
  "});",
  'console.log("D");',
].join("\n");

const eventLoopDefinition = {
  schemaVersion: SCHEMA_VERSION,
  id: "event-loop",
  title: "Which runs first: Promise or setTimeout?",
  description:
    "Browser event loop: a promise reaction runs after synchronous code and before a zero-delay timer.",
  width: 1080,
  height: 1920,
  fps: 30,
  defaultTheme: "dark",
  scenes: [
    {
      id: "hook",
      type: "hook",
      durationInFrames: 90,
      kicker: "Browser event loop",
      title: "Which runs first: Promise or setTimeout?",
    },
    {
      id: "code",
      type: "code-walkthrough",
      durationInFrames: 120,
      language: "JavaScript",
      question: "What order hits the console?",
      code: snippet,
    },
    {
      id: "sync",
      type: "code-walkthrough",
      durationInFrames: 240,
      code: snippet,
      highlights: [
        {
          id: "print-a",
          startFrame: 0,
          endFrame: 40,
          lines: [1],
          note: "A prints now.",
        },
        {
          id: "timer",
          startFrame: 40,
          endFrame: 80,
          lines: [2, 3, 4],
          note: "The host owns this timer.",
        },
        {
          id: "microtask",
          startFrame: 80,
          endFrame: 120,
          lines: [5, 6, 7],
          note: "The microtask is queued.",
        },
        {
          id: "print-d",
          startFrame: 120,
          endFrame: 240,
          lines: [8],
          note: "D prints now.",
        },
      ],
      captions: [
        {
          id: "console-a",
          text: "Console: A",
          startFrame: 0,
          endFrame: 120,
        },
        {
          id: "console-ad",
          text: "Console: A D",
          startFrame: 120,
          endFrame: 240,
        },
      ],
      console: [
        { id: "a", values: ["A"], startFrame: 0, endFrame: 120 },
        { id: "ad", values: ["A", "D"], startFrame: 120, endFrame: 240 },
      ],
    },
    {
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
        {
          id: "queue-to-stack",
          from: "microtask-queue",
          to: "call-stack",
        },
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
          targets: ["call-stack", "c", "queue-to-stack"],
        },
      ],
      captions: [
        {
          id: "stack-clear",
          text: "Synchronous code has finished.",
          startFrame: 0,
          endFrame: 60,
        },
        {
          id: "reaction-queued",
          text: "The promise reaction is queued.",
          startFrame: 60,
          endFrame: 120,
        },
        {
          id: "c-runs",
          text: "C runs on the stack.",
          startFrame: 120,
          endFrame: 180,
        },
      ],
      console: [
        { id: "ad", values: ["A", "D"], startFrame: 0, endFrame: 120 },
        {
          id: "adc",
          values: ["A", "D", "C"],
          startFrame: 120,
          endFrame: 180,
        },
      ],
    },
    {
      id: "timer",
      type: "diagram",
      durationInFrames: 120,
      title: "Browser event loop",
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
      connectors: [
        { id: "task-to-stack", from: "task-queue", to: "call-stack" },
      ],
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
          targets: ["call-stack", "b", "task-to-stack"],
        },
      ],
      captions: [
        {
          id: "timer-waits",
          text: "The timer callback is waiting.",
          startFrame: 0,
          endFrame: 60,
        },
        {
          id: "b-runs",
          text: "B runs on the next task.",
          startFrame: 60,
          endFrame: 120,
        },
      ],
      console: [
        {
          id: "adc",
          values: ["A", "D", "C"],
          startFrame: 0,
          endFrame: 60,
        },
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
} satisfies VideoDefinitionInput;

export const eventLoopVideo = parseVideoDefinition(eventLoopDefinition);
