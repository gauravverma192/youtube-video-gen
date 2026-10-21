import { intervalWithin, intervalsOverlap } from "./intervals";
import type { Scene, VideoDefinition } from "./schema";
import { videoDefinitionSchema } from "./schema";

export type ValidationIssue = {
  videoId: string;
  sceneId: string | null;
  field: string;
  message: string;
};

export function formatValidationIssue(issue: ValidationIssue): string {
  const scene = issue.sceneId === null ? "" : ` scene "${issue.sceneId}"`;
  return `video "${issue.videoId}"${scene} field "${issue.field}": ${issue.message}`;
}

export class VideoValidationError extends Error {
  readonly issues: readonly ValidationIssue[];

  constructor(issues: readonly ValidationIssue[]) {
    super(issues.map(formatValidationIssue).join("\n"));
    this.name = "VideoValidationError";
    this.issues = issues;
  }
}

type ParsedIssue = {
  code: string;
  path: ReadonlyArray<PropertyKey>;
  message: string;
  keys?: ReadonlyArray<string>;
  note?: string;
};

type IdOccurrence = {
  id: string;
  field: string;
};

export function collectVideoIssues(input: unknown): ValidationIssue[] {
  return assessVideo(input).issues;
}

export function parseVideoDefinition(input: unknown): VideoDefinition {
  const assessed = assessVideo(input);
  if (assessed.issues.length > 0 || !assessed.video) {
    throw new VideoValidationError(assessed.issues);
  }
  return assessed.video;
}

function assessVideo(input: unknown): {
  video: VideoDefinition | null;
  issues: ValidationIssue[];
} {
  const videoId = readVideoId(input);
  const parsed = videoDefinitionSchema.safeParse(input);
  if (!parsed.success) {
    const issues: ValidationIssue[] = [];
    for (const issue of parsed.error.issues) {
      for (const named of zodIssueToValidation(input, videoId, issue)) {
        issues.push(named);
      }
    }
    return { video: null, issues };
  }

  return { video: parsed.data, issues: semanticIssues(parsed.data) };
}

function semanticIssues(video: VideoDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  reportDuplicateIds(
    issues,
    video.id,
    null,
    video.scenes.map((scene, index) => ({
      id: scene.id,
      field: `scenes[${String(index)}].id`,
    })),
    (id) => id,
  );

  for (const scene of video.scenes) {
    validateCommonCues(video.id, scene, issues);
    switch (scene.type) {
      case "hook":
      case "takeaway":
      case "text-and-icon":
        break;
      case "code-walkthrough":
        validateCodeWalkthrough(video.id, scene, issues);
        break;
      case "diagram":
        validateDiagram(video.id, scene, issues);
        break;
      default:
        assertNever(scene);
    }
  }

  return issues;
}

function validateCommonCues(
  videoId: string,
  scene: Scene,
  issues: ValidationIssue[],
): void {
  reportDuplicateIds(
    issues,
    videoId,
    scene.id,
    scene.captions.map((cue, index) => ({
      id: cue.id,
      field: `captions[${String(index)}].id`,
    })),
  );
  reportDuplicateIds(
    issues,
    videoId,
    scene.id,
    scene.console.map((cue, index) => ({
      id: cue.id,
      field: `console[${String(index)}].id`,
    })),
  );

  scene.captions.forEach((cue, index) => {
    checkLocalInterval(
      issues,
      videoId,
      scene,
      `captions[${String(index)}]`,
      cue,
      "caption",
    );
  });
  scene.console.forEach((cue, index) => {
    checkLocalInterval(
      issues,
      videoId,
      scene,
      `console[${String(index)}]`,
      cue,
      "console cue",
    );
  });

  reportOverlaps(
    issues,
    videoId,
    scene.id,
    "captions",
    scene.captions,
    "caption",
  );
  reportOverlaps(
    issues,
    videoId,
    scene.id,
    "console",
    scene.console,
    "console cue",
  );
}

function validateCodeWalkthrough(
  videoId: string,
  scene: Extract<Scene, { type: "code-walkthrough" }>,
  issues: ValidationIssue[],
): void {
  const lineCount = scene.code.split("\n").length;
  reportDuplicateIds(
    issues,
    videoId,
    scene.id,
    scene.highlights.map((highlight, index) => ({
      id: highlight.id,
      field: `highlights[${String(index)}].id`,
    })),
  );

  scene.highlights.forEach((highlight, index) => {
    const field = `highlights[${String(index)}]`;
    checkLocalInterval(issues, videoId, scene, field, highlight, "beat");

    const seenLines = new Set<number>();
    highlight.lines.forEach((line, lineIndex) => {
      const lineField = `${field}.lines[${String(lineIndex)}]`;
      if (seenLines.has(line)) {
        push(
          issues,
          videoId,
          scene.id,
          lineField,
          `duplicate line ${String(line)}`,
        );
      }
      seenLines.add(line);
      if (line > lineCount) {
        push(
          issues,
          videoId,
          scene.id,
          lineField,
          `line ${String(line)} does not exist`,
        );
      }
    });
  });
}

function validateDiagram(
  videoId: string,
  scene: Extract<Scene, { type: "diagram" }>,
  issues: ValidationIssue[],
): void {
  const reserved = new Map<string, string>();

  const claim = (id: string, kind: string, field: string) => {
    const existing = reserved.get(id);
    if (existing && !(existing === "item" && kind === "item")) {
      push(issues, videoId, scene.id, field, `duplicate id "${id}"`);
      return;
    }
    if (!existing) {
      reserved.set(id, kind);
    }
  };

  scene.nodes.forEach((node, nodeIndex) => {
    claim(node.id, "node", `nodes[${String(nodeIndex)}].id`);
    node.items.forEach((item, itemIndex) => {
      claim(
        item.id,
        "item",
        `nodes[${String(nodeIndex)}].items[${String(itemIndex)}].id`,
      );
      checkLocalInterval(
        issues,
        videoId,
        scene,
        `nodes[${String(nodeIndex)}].items[${String(itemIndex)}]`,
        item,
        "beat",
      );
    });
  });

  scene.connectors.forEach((connector, index) => {
    claim(connector.id, "connector", `connectors[${String(index)}].id`);
    if (
      !reserved.has(connector.from) ||
      reserved.get(connector.from) !== "node"
    ) {
      push(
        issues,
        videoId,
        scene.id,
        `connectors[${String(index)}].from`,
        `unknown node "${connector.from}"`,
      );
    }
    if (!reserved.has(connector.to) || reserved.get(connector.to) !== "node") {
      push(
        issues,
        videoId,
        scene.id,
        `connectors[${String(index)}].to`,
        `unknown node "${connector.to}"`,
      );
    }
  });

  scene.emphasis.forEach((beat, index) => {
    claim(beat.id, "emphasis", `emphasis[${String(index)}].id`);
    checkLocalInterval(
      issues,
      videoId,
      scene,
      `emphasis[${String(index)}]`,
      beat,
      "beat",
    );
    beat.targets.forEach((target, targetIndex) => {
      const kind = reserved.get(target);
      if (kind !== "node" && kind !== "item" && kind !== "connector") {
        push(
          issues,
          videoId,
          scene.id,
          `emphasis[${String(index)}].targets[${String(targetIndex)}]`,
          `unknown target "${target}"`,
        );
      }
    });
  });

  const placements = new Map<
    string,
    { label: string; field: string; startFrame: number; endFrame: number }[]
  >();
  scene.nodes.forEach((node, nodeIndex) => {
    node.items.forEach((item, itemIndex) => {
      const field = `nodes[${String(nodeIndex)}].items[${String(itemIndex)}]`;
      const existing = placements.get(item.id) ?? [];
      existing.push({
        label: item.label,
        field,
        startFrame: item.startFrame,
        endFrame: item.endFrame,
      });
      placements.set(item.id, existing);
    });
  });

  for (const [itemId, occurrences] of placements) {
    const first = occurrences[0];
    if (!first) {
      continue;
    }
    for (let index = 1; index < occurrences.length; index++) {
      const occurrence = occurrences[index];
      if (!occurrence) {
        continue;
      }
      if (occurrence.label !== first.label) {
        push(
          issues,
          videoId,
          scene.id,
          `${occurrence.field}.label`,
          `item "${itemId}" has conflicting labels`,
        );
      }
      for (let earlier = 0; earlier < index; earlier++) {
        const previous = occurrences[earlier];
        if (previous && intervalsOverlap(previous, occurrence)) {
          push(
            issues,
            videoId,
            scene.id,
            occurrence.field,
            `item "${itemId}" has overlapping placements`,
          );
        }
      }
    }
  }
}

function reportOverlaps(
  issues: ValidationIssue[],
  videoId: string,
  sceneId: string,
  fieldPrefix: string,
  cues: readonly { id: string; startFrame: number; endFrame: number }[],
  noun: "caption" | "console cue",
): void {
  for (let left = 0; left < cues.length; left++) {
    for (let right = left + 1; right < cues.length; right++) {
      const earlier = cues[left];
      const later = cues[right];
      if (!earlier || !later) {
        continue;
      }
      if (intervalsOverlap(earlier, later)) {
        push(
          issues,
          videoId,
          sceneId,
          `${fieldPrefix}[${String(right)}]`,
          `${noun} "${later.id}" overlaps ${noun} "${earlier.id}"`,
        );
      }
    }
  }
}

function checkLocalInterval(
  issues: ValidationIssue[],
  videoId: string,
  scene: { id: string; durationInFrames: number },
  field: string,
  interval: { startFrame: number; endFrame: number },
  noun: "beat" | "caption" | "console cue",
): void {
  if (interval.endFrame <= interval.startFrame) {
    push(
      issues,
      videoId,
      scene.id,
      field,
      `${noun} must cover a positive number of frames (starts at ${String(interval.startFrame)}, ends at ${String(interval.endFrame)})`,
    );
    return;
  }
  if (
    !intervalWithin(interval, {
      startFrame: 0,
      endFrame: scene.durationInFrames,
    })
  ) {
    push(
      issues,
      videoId,
      scene.id,
      field,
      `${noun} is outside the scene (starts at ${String(interval.startFrame)}, ends at ${String(interval.endFrame)}, scene ends at ${String(scene.durationInFrames)})`,
    );
  }
}

function reportDuplicateIds(
  issues: ValidationIssue[],
  videoId: string,
  sceneId: string | null,
  entries: readonly IdOccurrence[],
  sceneIdFor?: (id: string) => string,
): void {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.id)) {
      push(
        issues,
        videoId,
        sceneIdFor ? sceneIdFor(entry.id) : sceneId,
        entry.field,
        `duplicate id "${entry.id}"`,
      );
      continue;
    }
    seen.add(entry.id);
  }
}

function push(
  issues: ValidationIssue[],
  videoId: string,
  sceneId: string | null,
  field: string,
  message: string,
): void {
  issues.push({ videoId, sceneId, field, message });
}

function zodIssueToValidation(
  input: unknown,
  videoId: string,
  issue: ParsedIssue,
): ValidationIssue[] {
  const sceneIndex = sceneIndexFromPath(issue.path);
  const sceneId = sceneIndex === null ? null : readSceneId(input, sceneIndex);
  const pathAfterScene = sceneIndex === null ? issue.path : issue.path.slice(2);

  if (issue.code === "unrecognized_keys" && issue.keys) {
    return issue.keys.map((key) => ({
      videoId,
      sceneId,
      field: joinField(formatPath(pathAfterScene), key),
      message: `unrecognized field "${key}"`,
    }));
  }

  const field = formatPath(pathAfterScene);
  return [
    {
      videoId,
      sceneId,
      field,
      message: zodMessage(input, issue, field),
    },
  ];
}

function zodMessage(input: unknown, issue: ParsedIssue, field: string): string {
  if (
    issue.note === "No matching discriminator" ||
    (issue.code === "invalid_union" && field === "type")
  ) {
    const received = valueAt(input, issue.path);
    if (typeof received === "string") {
      return `unknown scene type "${received}"`;
    }
    return "unknown scene type";
  }
  if (
    field === "durationInFrames" &&
    (issue.code === "too_small" || issue.code === "invalid_type")
  ) {
    return "duration must be a positive integer";
  }
  if (field === "scenes" && issue.code === "too_small") {
    return "a video must contain at least one scene";
  }
  if (field === "schemaVersion") {
    return "expected schema version 1";
  }
  if (field === "defaultTheme") {
    return 'theme must be "light" or "dark"';
  }
  return issue.message;
}

function sceneIndexFromPath(path: ReadonlyArray<PropertyKey>): number | null {
  if (path[0] !== "scenes" || typeof path[1] !== "number") {
    return null;
  }
  return path[1];
}

function formatPath(path: ReadonlyArray<PropertyKey>): string {
  let field = "";
  for (const segment of path) {
    if (typeof segment === "number") {
      field += `[${String(segment)}]`;
      continue;
    }
    if (typeof segment !== "string") {
      continue;
    }
    field = field.length === 0 ? segment : `${field}.${segment}`;
  }
  return field.length === 0 ? "(root)" : field;
}

function joinField(parent: string, key: string): string {
  if (parent === "(root)" || parent.length === 0) {
    return key;
  }
  return `${parent}.${key}`;
}

function readVideoId(input: unknown): string {
  if (isRecord(input) && typeof input.id === "string" && input.id.length > 0) {
    return input.id;
  }
  return "unknown";
}

function readSceneId(input: unknown, index: number): string | null {
  if (!isRecord(input) || !Array.isArray(input.scenes)) {
    return null;
  }
  const scene = input.scenes[index];
  if (isRecord(scene) && typeof scene.id === "string" && scene.id.length > 0) {
    return scene.id;
  }
  return null;
}

function valueAt(input: unknown, path: ReadonlyArray<PropertyKey>): unknown {
  let current = input;
  for (const segment of path) {
    if (typeof segment === "number") {
      if (!Array.isArray(current)) {
        return undefined;
      }
      current = current[segment];
      continue;
    }
    if (typeof segment === "string") {
      if (!isRecord(current)) {
        return undefined;
      }
      current = current[segment];
      continue;
    }
    return undefined;
  }
  return current;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertNever(value: never): never {
  throw new Error(`Unhandled scene type: ${JSON.stringify(value)}`);
}
