import { SCHEMA_VERSION, parseVideoDefinition } from "../engine";

const sampleCode = [
  'console.log("A");',
  "setTimeout(() => {",
  '  console.log("B");',
  "}, 0);",
  "Promise.resolve().then(() => {",
  '  console.log("C");',
  "});",
  'console.log("D");',
].join("\n");

/** Studio fixture that exercises every scene template at short size. */
export const templateGalleryVideo = parseVideoDefinition({
  schemaVersion: SCHEMA_VERSION,
  id: "template-gallery",
  title: "Scene templates",
  description: "Gallery of the five scene templates.",
  width: 1080,
  height: 1920,
  fps: 30,
  defaultTheme: "dark",
  scenes: [
    {
      id: "hook",
      type: "hook",
      durationInFrames: 75,
      kicker: "Hook",
      title: "Which runs first: Promise or setTimeout?",
      captions: [
        {
          id: "hook-caption",
          text: "The order is the whole lesson.",
          startFrame: 0,
          endFrame: 75,
        },
      ],
    },
    {
      id: "code",
      type: "code-walkthrough",
      durationInFrames: 120,
      language: "JavaScript",
      question: "What prints first?",
      code: sampleCode,
      highlights: [
        {
          id: "print-a",
          startFrame: 0,
          endFrame: 45,
          lines: [1],
          note: "This call runs immediately.",
        },
        {
          id: "print-d",
          startFrame: 45,
          endFrame: 120,
          lines: [8],
          note: "So does this one.",
        },
      ],
      captions: [
        {
          id: "code-caption",
          text: "The answer stays hidden.",
          startFrame: 0,
          endFrame: 120,
        },
      ],
      console: [
        {
          id: "code-console",
          values: ["A", "D"],
          startFrame: 80,
          endFrame: 120,
        },
      ],
    },
    {
      id: "microtask",
      type: "diagram",
      durationInFrames: 120,
      title: "Browser event loop",
      nodes: [
        {
          id: "call-stack",
          label: "Call stack",
          items: [{ id: "c", label: "C", startFrame: 60, endFrame: 120 }],
        },
        {
          id: "microtask-queue",
          label: "Microtask queue",
          items: [{ id: "c", label: "C", startFrame: 0, endFrame: 60 }],
        },
      ],
      connectors: [
        {
          id: "queue-to-stack",
          from: "microtask-queue",
          to: "call-stack",
          label: "next",
        },
      ],
      emphasis: [
        {
          id: "queued",
          startFrame: 0,
          endFrame: 60,
          targets: ["microtask-queue", "c"],
        },
        {
          id: "running",
          startFrame: 60,
          endFrame: 120,
          targets: ["call-stack", "c", "queue-to-stack"],
        },
      ],
      captions: [
        {
          id: "queued-caption",
          text: "The reaction waits in the queue.",
          startFrame: 0,
          endFrame: 60,
        },
        {
          id: "running-caption",
          text: "Then it runs on the stack.",
          startFrame: 60,
          endFrame: 120,
        },
      ],
      console: [
        {
          id: "microtask-console",
          values: ["A", "D", "C"],
          startFrame: 60,
          endFrame: 120,
        },
      ],
    },
    {
      id: "takeaway",
      type: "takeaway",
      durationInFrames: 75,
      sequence: ["A", "D", "C", "B"],
      sentence:
        "Microtasks run after synchronous code and before the next task.",
    },
    {
      id: "text-and-icon",
      type: "text-and-icon",
      durationInFrames: 75,
      icon: "JS",
      title: "Text and icon",
      body: "A short scene with one mark, a title, and a sentence.",
      captions: [
        {
          id: "icon-caption",
          text: "Captions sit inside the safe area.",
          startFrame: 0,
          endFrame: 75,
        },
      ],
    },
  ],
});
