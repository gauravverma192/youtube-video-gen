export {
  SCENE_TYPES,
  SCHEMA_VERSION,
  codeWalkthroughSceneSchema,
  diagramSceneSchema,
  hookSceneSchema,
  sceneSchema,
  takeawaySceneSchema,
  textAndIconSceneSchema,
  themeSchema,
  videoDefinitionSchema,
} from "./schema";
export type {
  CaptionCue,
  CodeHighlight,
  CodeWalkthroughScene,
  ConsoleCue,
  DiagramConnector,
  DiagramEmphasis,
  DiagramItem,
  DiagramNode,
  DiagramScene,
  HookScene,
  Scene,
  TakeawayScene,
  TextAndIconScene,
  ThemeId,
  VideoDefinition,
  VideoDefinitionInput,
} from "./schema";

export {
  containsFrame,
  intervalWithin,
  intervalsAtFrame,
  intervalsOverlap,
  sceneBounds,
  secondsToFrames,
} from "./intervals";
export type { FrameInterval } from "./intervals";

export {
  buildTimeline,
  localFrame,
  sceneAtFrame,
  sceneIntervalToGlobal,
} from "./timeline";
export type { Timeline, TimelineEntry } from "./timeline";

export {
  VideoValidationError,
  collectVideoIssues,
  formatValidationIssue,
  parseVideoDefinition,
} from "./validate";
export type { ValidationIssue } from "./validate";

export {
  buildPreviewProps,
  calculateVideoMetadata,
  createVideoCalculateMetadata,
  resolveVideoMetadata,
} from "./metadata";
export type {
  PreviewPlayerProps,
  VideoInputProps,
  VideoMetadata,
} from "./metadata";

export { resolveDiagramState } from "./diagram";
export type {
  ResolvedDiagram,
  ResolvedDiagramConnector,
  ResolvedDiagramItem,
  ResolvedDiagramNode,
} from "./diagram";

export { consoleAtFrame, finalConsoleOrder } from "./console";
