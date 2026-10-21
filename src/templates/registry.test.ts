import { describe, expect, it } from "vitest";
import { z } from "zod";
import { SCENE_TYPES, hookSceneSchema } from "../engine";
import {
  listSceneTypes,
  registerScene,
  requireSceneTemplate,
  sceneTemplate,
} from "./registry";

describe("scene registry", () => {
  it("registers the five templates and a custom scene the same way", () => {
    expect(listSceneTypes()).toEqual([...SCENE_TYPES]);

    expect(() =>
      registerScene({
        type: "hook",
        schema: hookSceneSchema,
        Component: () => null,
      }),
    ).toThrow(/already registered/);

    const schema = z.object({
      type: z.literal("callout"),
      text: z.string(),
    });
    registerScene({
      type: "callout",
      schema,
      Component: () => null,
    });

    expect(sceneTemplate("callout")?.type).toBe("callout");
    expect(
      sceneTemplate("callout")?.schema.parse({ type: "callout", text: "Hi" }),
    ).toEqual({ type: "callout", text: "Hi" });
    expect(() => requireSceneTemplate("missing")).toThrow(/missing/);
  });
});
