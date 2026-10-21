import type { FC } from "react";
import type { ZodType } from "zod";

export type SceneTemplateProps<TScene> = {
  scene: TScene;
};

export type SceneTemplate<TScene extends { type: string }> = {
  type: TScene["type"];
  schema: ZodType<TScene>;
  Component: FC<SceneTemplateProps<TScene>>;
};
