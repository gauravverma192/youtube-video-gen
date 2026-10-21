import { SCHEMA_VERSION, parseVideoDefinition } from "../engine";
import type { VideoDefinitionInput } from "../engine";

/**
 * Copy this file, change the id, and append the parsed video in registry.ts.
 * Hook, text-and-icon, and takeaway only.
 */
const starterDefinition = {
  schemaVersion: SCHEMA_VERSION,
  id: "starter",
  title: "Starter",
  description: "A three-scene Short to copy when adding a video.",
  width: 1080,
  height: 1920,
  fps: 30,
  defaultTheme: "dark",
  scenes: [
    {
      id: "hook",
      type: "hook",
      durationInFrames: 90,
      kicker: "Starter",
      title: "Copy this file to make a Short",
    },
    {
      id: "idea",
      type: "text-and-icon",
      durationInFrames: 90,
      icon: "01",
      title: "One idea",
      body: "A type, a duration, and the words on screen.",
      captions: [
        {
          id: "plain-data",
          text: "Scenes stay plain data.",
          startFrame: 0,
          endFrame: 90,
        },
      ],
    },
    {
      id: "takeaway",
      type: "takeaway",
      durationInFrames: 90,
      sequence: ["Copy", "Edit", "Add"],
      sentence: "Add one registry entry and the new Short is selectable.",
    },
  ],
} satisfies VideoDefinitionInput;

export const starterVideo = parseVideoDefinition(starterDefinition);
