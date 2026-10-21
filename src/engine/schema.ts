import { z } from "zod";

export const SCHEMA_VERSION = 1 as const;

export const themeSchema = z.enum(["light", "dark"]);

const idSchema = z.string().min(1);

/** Scene-local frame index. End frames are exclusive and may equal the scene duration. */
const frameIndexSchema = z.number().int().nonnegative();

const captionSchema = z
  .object({
    id: idSchema,
    text: z.string().min(1),
    startFrame: frameIndexSchema,
    endFrame: frameIndexSchema,
  })
  .strict();

const consoleCueSchema = z
  .object({
    id: idSchema,
    values: z.array(z.string().min(1)).min(1),
    startFrame: frameIndexSchema,
    endFrame: frameIndexSchema,
  })
  .strict();

const sceneCommonShape = {
  id: idSchema,
  durationInFrames: z.number().int().positive(),
  captions: z.array(captionSchema).default([]),
  console: z.array(consoleCueSchema).default([]),
};

const highlightSchema = z
  .object({
    id: idSchema,
    startFrame: frameIndexSchema,
    endFrame: frameIndexSchema,
    lines: z.array(z.number().int().positive()).min(1),
    note: z.string().min(1).optional(),
  })
  .strict();

const diagramItemSchema = z
  .object({
    id: idSchema,
    label: z.string().min(1),
    startFrame: frameIndexSchema,
    endFrame: frameIndexSchema,
  })
  .strict();

const diagramNodeSchema = z
  .object({
    id: idSchema,
    label: z.string().min(1),
    items: z.array(diagramItemSchema).default([]),
  })
  .strict();

const diagramConnectorSchema = z
  .object({
    id: idSchema,
    from: idSchema,
    to: idSchema,
    label: z.string().min(1).optional(),
  })
  .strict();

const diagramEmphasisSchema = z
  .object({
    id: idSchema,
    startFrame: frameIndexSchema,
    endFrame: frameIndexSchema,
    targets: z.array(idSchema).min(1),
  })
  .strict();

export const hookSceneSchema = z
  .object({
    ...sceneCommonShape,
    type: z.literal("hook"),
    kicker: z.string().min(1).optional(),
    title: z.string().min(1),
  })
  .strict();

export const codeWalkthroughSceneSchema = z
  .object({
    ...sceneCommonShape,
    type: z.literal("code-walkthrough"),
    code: z.string().min(1),
    language: z.string().min(1).optional(),
    question: z.string().min(1).optional(),
    highlights: z.array(highlightSchema).default([]),
  })
  .strict();

export const diagramSceneSchema = z
  .object({
    ...sceneCommonShape,
    type: z.literal("diagram"),
    title: z.string().min(1).optional(),
    nodes: z.array(diagramNodeSchema).min(1),
    connectors: z.array(diagramConnectorSchema).default([]),
    emphasis: z.array(diagramEmphasisSchema).default([]),
  })
  .strict();

export const takeawaySceneSchema = z
  .object({
    ...sceneCommonShape,
    type: z.literal("takeaway"),
    sequence: z.array(z.string().min(1)).min(1),
    sentence: z.string().min(1),
  })
  .strict();

export const textAndIconSceneSchema = z
  .object({
    ...sceneCommonShape,
    type: z.literal("text-and-icon"),
    icon: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1).optional(),
  })
  .strict();

export const SCENE_TYPES = [
  "hook",
  "code-walkthrough",
  "diagram",
  "takeaway",
  "text-and-icon",
] as const;

export const sceneSchema = z.discriminatedUnion("type", [
  hookSceneSchema,
  codeWalkthroughSceneSchema,
  diagramSceneSchema,
  takeawaySceneSchema,
  textAndIconSceneSchema,
]);

export const videoDefinitionSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    id: idSchema,
    title: z.string().min(1),
    description: z.string(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    fps: z.number().int().positive(),
    defaultTheme: themeSchema,
    scenes: z.array(sceneSchema).min(1),
  })
  .strict();

export type ThemeId = z.infer<typeof themeSchema>;
export type CaptionCue = z.infer<typeof captionSchema>;
export type ConsoleCue = z.infer<typeof consoleCueSchema>;
export type CodeHighlight = z.infer<typeof highlightSchema>;
export type DiagramItem = z.infer<typeof diagramItemSchema>;
export type DiagramNode = z.infer<typeof diagramNodeSchema>;
export type DiagramConnector = z.infer<typeof diagramConnectorSchema>;
export type DiagramEmphasis = z.infer<typeof diagramEmphasisSchema>;
export type HookScene = z.infer<typeof hookSceneSchema>;
export type CodeWalkthroughScene = z.infer<typeof codeWalkthroughSceneSchema>;
export type DiagramScene = z.infer<typeof diagramSceneSchema>;
export type TakeawayScene = z.infer<typeof takeawaySceneSchema>;
export type TextAndIconScene = z.infer<typeof textAndIconSceneSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type VideoDefinition = z.infer<typeof videoDefinitionSchema>;
export type VideoDefinitionInput = z.input<typeof videoDefinitionSchema>;
