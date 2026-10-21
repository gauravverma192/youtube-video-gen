import { describe, expect, it } from "vitest";
import {
  VideoValidationError,
  collectVideoIssues,
  formatValidationIssue,
  parseVideoDefinition,
} from "./validate";
import type { ValidationIssue } from "./validate";

function video(scenes: unknown[], id = "demo") {
  return {
    schemaVersion: 1,
    id,
    title: "Demo",
    description: "",
    width: 1080,
    height: 1920,
    fps: 30,
    defaultTheme: "dark",
    scenes,
  };
}

function hook(overrides: Record<string, unknown> = {}) {
  return {
    id: "hook",
    type: "hook",
    durationInFrames: 90,
    title: "Which runs first?",
    ...overrides,
  };
}

function expectIssue(
  input: unknown,
  expected: Partial<ValidationIssue> & Pick<ValidationIssue, "message">,
) {
  const issues = collectVideoIssues(input);
  expect(issues).toEqual(
    expect.arrayContaining([expect.objectContaining(expected)]),
  );
  const match = issues.find((issue) => issue.message === expected.message);
  if (!match) {
    throw new Error(`missing issue: ${expected.message}`);
  }
  expect(() => parseVideoDefinition(input)).toThrow(VideoValidationError);
  expect(() => parseVideoDefinition(input)).toThrow(
    formatValidationIssue(match),
  );
}

describe("video definition validation", () => {
  it("accepts a definition and fills omitted cue lists", () => {
    const parsed = parseVideoDefinition(
      video([
        hook({
          captions: [
            { id: "open", text: "Start", startFrame: 0, endFrame: 90 },
          ],
        }),
        {
          id: "note",
          type: "text-and-icon",
          durationInFrames: 60,
          icon: "timer",
          title: "Timers wait",
          body: "The host owns the clock.",
        },
      ]),
    );

    expect(parsed.scenes[0]?.captions).toEqual([
      { id: "open", text: "Start", startFrame: 0, endFrame: 90 },
    ]);
    expect(parsed.scenes[0]?.console).toEqual([]);
    expect(parsed.scenes[1]?.captions).toEqual([]);
    expect(collectVideoIssues(video([hook()]))).toEqual([]);
  });

  it("allows cues that touch at an exclusive boundary", () => {
    const parsed = parseVideoDefinition(
      video([
        hook({
          durationInFrames: 30,
          captions: [
            { id: "a", text: "A", startFrame: 0, endFrame: 10 },
            { id: "b", text: "B", startFrame: 10, endFrame: 30 },
          ],
        }),
      ]),
    );

    expect(parsed.scenes[0]?.captions).toHaveLength(2);
  });

  it("names the video, scene, and field for duplicate ids", () => {
    expectIssue(video([hook(), hook({ title: "Again" })]), {
      videoId: "demo",
      sceneId: "hook",
      field: "scenes[1].id",
      message: 'duplicate id "hook"',
    });

    expectIssue(
      video([
        hook({
          captions: [
            { id: "cue", text: "First", startFrame: 0, endFrame: 10 },
            { id: "cue", text: "Second", startFrame: 10, endFrame: 20 },
          ],
        }),
      ]),
      {
        videoId: "demo",
        sceneId: "hook",
        field: "captions[1].id",
        message: 'duplicate id "cue"',
      },
    );
  });

  it("names the video, scene, and field for an unknown scene type", () => {
    expectIssue(
      video([
        { id: "intro", type: "slideshow", durationInFrames: 30, title: "Hi" },
      ]),
      {
        videoId: "demo",
        sceneId: "intro",
        field: "type",
        message: 'unknown scene type "slideshow"',
      },
    );
  });

  it("names the video, scene, and field for a non-positive duration", () => {
    expectIssue(video([hook({ durationInFrames: 0 })]), {
      videoId: "demo",
      sceneId: "hook",
      field: "durationInFrames",
      message: "duration must be a positive integer",
    });

    expectIssue(video([hook({ durationInFrames: 1.5 })]), {
      videoId: "demo",
      sceneId: "hook",
      field: "durationInFrames",
      message: "duration must be a positive integer",
    });
  });

  it("names the video, scene, and field for a bad reference", () => {
    expectIssue(
      video([
        {
          id: "queues",
          type: "diagram",
          durationInFrames: 90,
          nodes: [{ id: "call-stack", label: "Call stack" }],
          connectors: [{ id: "edge", from: "call-stack", to: "missing" }],
        },
      ]),
      {
        videoId: "demo",
        sceneId: "queues",
        field: "connectors[0].to",
        message: 'unknown node "missing"',
      },
    );

    expectIssue(
      video([
        {
          id: "code",
          type: "code-walkthrough",
          durationInFrames: 90,
          code: "console.log('A');",
          highlights: [
            { id: "print-a", startFrame: 0, endFrame: 30, lines: [4] },
          ],
        },
      ]),
      {
        videoId: "demo",
        sceneId: "code",
        field: "highlights[0].lines[0]",
        message: "line 4 does not exist",
      },
    );

    expectIssue(
      video([
        {
          id: "queues",
          type: "diagram",
          durationInFrames: 90,
          nodes: [{ id: "call-stack", label: "Call stack" }],
          emphasis: [
            {
              id: "focus",
              startFrame: 0,
              endFrame: 30,
              targets: ["task-queue"],
            },
          ],
        },
      ]),
      {
        videoId: "demo",
        sceneId: "queues",
        field: "emphasis[0].targets[0]",
        message: 'unknown target "task-queue"',
      },
    );
  });

  it("names the video, scene, and field for a beat outside the scene", () => {
    expectIssue(
      video([
        {
          id: "code",
          type: "code-walkthrough",
          durationInFrames: 90,
          code: "console.log('A');\nconsole.log('D');",
          highlights: [
            { id: "print-a", startFrame: 80, endFrame: 100, lines: [1] },
          ],
        },
      ]),
      {
        videoId: "demo",
        sceneId: "code",
        field: "highlights[0]",
        message:
          "beat is outside the scene (starts at 80, ends at 100, scene ends at 90)",
      },
    );
  });

  it("names the video, scene, and field for overlapping caption cues", () => {
    expectIssue(
      video([
        hook({
          durationInFrames: 40,
          captions: [
            { id: "a", text: "A", startFrame: 0, endFrame: 20 },
            { id: "b", text: "B", startFrame: 19, endFrame: 40 },
          ],
        }),
      ]),
      {
        videoId: "demo",
        sceneId: "hook",
        field: "captions[1]",
        message: 'caption "b" overlaps caption "a"',
      },
    );
  });

  it("reports every broken invariant in one pass", () => {
    const issues = collectVideoIssues(
      video([
        hook({
          captions: [
            { id: "cue", text: "First", startFrame: 0, endFrame: 20 },
            { id: "cue", text: "Second", startFrame: 10, endFrame: 30 },
          ],
        }),
        hook({ title: "Again" }),
      ]),
    );

    expect(issues.map((issue) => issue.message)).toEqual([
      'duplicate id "hook"',
      'duplicate id "cue"',
      'caption "cue" overlaps caption "cue"',
    ]);
  });

  it("names a video-level field when the schema version is wrong", () => {
    expectIssue(
      { ...video([hook()]), schemaVersion: 2 },
      {
        videoId: "demo",
        sceneId: null,
        field: "schemaVersion",
        message: "expected schema version 1",
      },
    );
  });
});
