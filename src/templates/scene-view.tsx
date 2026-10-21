import type { FC } from "react";
import { requireSceneTemplate } from "./registry";

export const SceneView: FC<{ scene: { type: string } }> = ({ scene }) => {
  const template = requireSceneTemplate(scene.type);
  const parsed = template.schema.parse(scene);
  const Component = template.Component;
  return <Component scene={parsed} />;
};
