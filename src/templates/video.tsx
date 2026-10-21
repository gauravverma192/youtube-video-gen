import type { FC } from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { z } from "zod";
import { buildTimeline, themeSchema } from "../engine";
import type { ThemeId, VideoDefinition } from "../engine";
import { SceneView } from "./scene-view";
import { ThemeProvider } from "./theme-context";

export const videoInputSchema = z.object({
  theme: themeSchema,
});

export const Video: FC<{ video: VideoDefinition; theme?: ThemeId }> = ({
  video,
  theme,
}) => {
  const { fps } = useVideoConfig();
  const resolved = theme ?? video.defaultTheme;
  const timeline = buildTimeline(video.scenes);

  return (
    <ThemeProvider theme={resolved}>
      <AbsoluteFill>
        {timeline.scenes.map((entry) => {
          const scene = video.scenes[entry.index];
          if (!scene) {
            return null;
          }
          return (
            <Sequence
              key={scene.id}
              name={scene.id}
              from={entry.startFrame}
              durationInFrames={entry.durationInFrames}
              premountFor={fps}
            >
              <SceneView scene={scene} />
            </Sequence>
          );
        })}
      </AbsoluteFill>
    </ThemeProvider>
  );
};
