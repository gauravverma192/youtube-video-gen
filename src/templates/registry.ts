import type { FC } from "react";
import type { ZodType } from "zod";
import {
  codeWalkthroughSceneSchema,
  diagramSceneSchema,
  hookSceneSchema,
  takeawaySceneSchema,
  textAndIconSceneSchema,
} from "../engine";
import type { SceneTemplate } from "./registry-types";
import { CodeWalkthroughSceneView } from "./scenes/code-walkthrough";
import { DiagramSceneView } from "./scenes/diagram";
import { HookSceneView } from "./scenes/hook";
import { TakeawaySceneView } from "./scenes/takeaway";
import { TextAndIconSceneView } from "./scenes/text-and-icon";

type StoredSceneTemplate = {
  type: string;
  schema: ZodType<{ type: string }>;
  Component: FC<{ scene: { type: string } }>;
};

const templates = new Map<string, StoredSceneTemplate>();

/**
 * Built-in and custom scenes use the same registration: a type string, a Zod
 * schema, and a component. Content stays plain data. A definition accepts a
 * custom type only after that schema joins the scene union.
 */
export function registerScene<TScene extends { type: string }>(
  template: SceneTemplate<TScene>,
): void {
  if (templates.has(template.type)) {
    throw new Error(`Scene type "${template.type}" is already registered`);
  }
  templates.set(template.type, template as unknown as StoredSceneTemplate);
}

export function sceneTemplate(type: string): StoredSceneTemplate | undefined {
  return templates.get(type);
}

export function requireSceneTemplate(type: string): StoredSceneTemplate {
  const template = templates.get(type);
  if (!template) {
    throw new Error(`No scene template registered for type "${type}"`);
  }
  return template;
}

export function listSceneTypes(): string[] {
  return [...templates.keys()];
}

registerScene({
  type: "hook",
  schema: hookSceneSchema,
  Component: HookSceneView,
});
registerScene({
  type: "code-walkthrough",
  schema: codeWalkthroughSceneSchema,
  Component: CodeWalkthroughSceneView,
});
registerScene({
  type: "diagram",
  schema: diagramSceneSchema,
  Component: DiagramSceneView,
});
registerScene({
  type: "takeaway",
  schema: takeawaySceneSchema,
  Component: TakeawaySceneView,
});
registerScene({
  type: "text-and-icon",
  schema: textAndIconSceneSchema,
  Component: TextAndIconSceneView,
});
