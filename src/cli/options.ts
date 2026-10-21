import path from "node:path";

export type CliTheme = "light" | "dark";

export type CliContext = {
  cwd: string;
  projectRoot: string;
};

export type RenderOptions = {
  videoId: string;
  theme: CliTheme;
  outputPath: string;
};

export type StillOptions = RenderOptions & {
  frame: number;
};

export class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliUsageError";
  }
}

export const RENDER_USAGE =
  "Usage: npm run render -- --video=<id> --theme=light|dark [--out=<file.mp4>]";

export const STILL_USAGE =
  "Usage: npm run still -- --video=<id> --theme=light|dark --frame=<n> [--out=<file.png>]";

export function defaultRenderOutput(videoId: string, theme: CliTheme): string {
  return path.join("out", `${fileSlug(videoId)}-${theme}.mp4`);
}

export function defaultStillOutput(
  videoId: string,
  theme: CliTheme,
  frame: number,
): string {
  return path.join(
    "out",
    `${fileSlug(videoId)}-${theme}-${String(frame)}.png`,
  );
}

export function parseRenderOptions(
  argv: readonly string[],
  context: CliContext,
): RenderOptions {
  const flags = readFlags(argv, RENDER_USAGE, ["video", "theme", "out"]);
  const videoId = required(flags, "video", RENDER_USAGE);
  const theme = parseTheme(required(flags, "theme", RENDER_USAGE), RENDER_USAGE);
  return {
    videoId,
    theme,
    outputPath: resolveCliOutput({
      context,
      requested: flags.get("out") ?? null,
      fallback: defaultRenderOutput(videoId, theme),
      extension: ".mp4",
      usage: RENDER_USAGE,
    }),
  };
}

export function parseStillOptions(
  argv: readonly string[],
  context: CliContext,
): StillOptions {
  const flags = readFlags(argv, STILL_USAGE, [
    "video",
    "theme",
    "out",
    "frame",
  ]);
  const videoId = required(flags, "video", STILL_USAGE);
  const theme = parseTheme(required(flags, "theme", STILL_USAGE), STILL_USAGE);
  const frame = parseFrame(required(flags, "frame", STILL_USAGE), STILL_USAGE);
  return {
    videoId,
    theme,
    frame,
    outputPath: resolveCliOutput({
      context,
      requested: flags.get("out") ?? null,
      fallback: defaultStillOutput(videoId, theme, frame),
      extension: ".png",
      usage: STILL_USAGE,
    }),
  };
}

export function assertFrameInRange(
  frame: number,
  durationInFrames: number,
): void {
  if (frame < 0 || frame >= durationInFrames) {
    const last = Math.max(0, durationInFrames - 1);
    throw new CliUsageError(
      `Frame ${String(frame)} is outside this video (0–${String(last)}).`,
    );
  }
}

export function isInsideDirectory(parent: string, candidate: string): boolean {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  if (relative === "") {
    return true;
  }
  return (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function resolveCliOutput(options: {
  context: CliContext;
  requested: string | null;
  fallback: string;
  extension: ".mp4" | ".png";
  usage: string;
}): string {
  const target = options.requested ?? options.fallback;
  const resolved = path.resolve(options.context.cwd, target);
  if (path.extname(resolved).toLowerCase() !== options.extension) {
    throw usageError(
      `Output must be a ${options.extension} file.`,
      options.usage,
    );
  }
  const srcDir = path.resolve(options.context.projectRoot, "src");
  if (isUnderSrc(srcDir, resolved)) {
    throw new CliUsageError(`Refusing to write under src/: ${resolved}`);
  }
  return resolved;
}

function isUnderSrc(srcDir: string, candidate: string): boolean {
  if (isInsideDirectory(srcDir, candidate)) {
    return true;
  }
  const srcLower = srcDir.toLowerCase();
  const candidateLower = path.resolve(candidate).toLowerCase();
  return (
    candidateLower === srcLower ||
    candidateLower.startsWith(`${srcLower}${path.sep}`)
  );
}

function fileSlug(videoId: string): string {
  if (
    videoId === "." ||
    videoId === ".." ||
    videoId.includes("..") ||
    !/^[\w.-]+$/.test(videoId)
  ) {
    throw new CliUsageError(
      `Video id "${videoId}" cannot be used in a file name.`,
    );
  }
  return videoId;
}

function parseTheme(value: string, usage: string): CliTheme {
  if (value === "light" || value === "dark") {
    return value;
  }
  throw usageError('Theme must be "light" or "dark".', usage);
}

function parseFrame(value: string, usage: string): number {
  if (!/^[0-9]+$/.test(value)) {
    throw usageError("Frame must be a non-negative integer.", usage);
  }
  const frame = Number(value);
  if (!Number.isSafeInteger(frame)) {
    throw usageError("Frame must be a non-negative integer.", usage);
  }
  return frame;
}

function required(
  flags: ReadonlyMap<string, string>,
  name: string,
  usage: string,
): string {
  const value = flags.get(name);
  if (!value) {
    throw usageError(`Missing --${name}.`, usage);
  }
  return value;
}

function readFlags(
  argv: readonly string[],
  usage: string,
  allowed: readonly string[],
): Map<string, string> {
  const flags = new Map<string, string>();
  const allowedSet = new Set(allowed);
  const tokens = argv.filter((token) => token !== "--");

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (!token) {
      continue;
    }
    if (!token.startsWith("--")) {
      throw usageError(`Unexpected argument "${token}".`, usage);
    }

    const eq = token.indexOf("=");
    let key: string;
    let value: string | undefined;
    if (eq === -1) {
      key = token.slice(2);
      const next = tokens[index + 1];
      if (next && !next.startsWith("--")) {
        value = next;
        index += 1;
      }
    } else {
      key = token.slice(2, eq);
      value = token.slice(eq + 1);
    }

    if (key.length === 0 || value === undefined || value.length === 0) {
      throw usageError(`Missing value for --${key || "flag"}.`, usage);
    }
    if (!allowedSet.has(key)) {
      throw usageError(`Unknown flag --${key}.`, usage);
    }
    if (flags.has(key)) {
      throw usageError(`Duplicate flag --${key}.`, usage);
    }
    flags.set(key, value);
  }

  return flags;
}

function usageError(message: string, usage: string): CliUsageError {
  return new CliUsageError(`${message}\n${usage}`);
}
