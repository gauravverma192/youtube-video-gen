import type { FC } from "react";
import { Composition } from "remotion";
import { createVideoCalculateMetadata, resolveVideoMetadata } from "./engine";
import { studioCompositionSources } from "./studio/compositions";
import { bindVideo } from "./templates/bound-video";
import {
  TemplateGallery,
  templateGalleryVideo,
  videoInputSchema,
} from "./templates";

const galleryMetadata = resolveVideoMetadata(templateGalleryVideo);

const registered = studioCompositionSources().map((source) => ({
  ...source,
  component: bindVideo(source.video),
}));

export const RemotionRoot: FC = () => {
  return (
    <>
      {registered.map((entry) => (
        <Composition
          key={entry.id}
          id={entry.id}
          component={entry.component}
          durationInFrames={entry.metadata.durationInFrames}
          fps={entry.metadata.fps}
          width={entry.metadata.width}
          height={entry.metadata.height}
          defaultProps={{ theme: entry.video.defaultTheme }}
          schema={videoInputSchema}
          calculateMetadata={entry.calculateMetadata}
        />
      ))}
      <Composition
        id="template-gallery"
        component={TemplateGallery}
        durationInFrames={galleryMetadata.durationInFrames}
        fps={galleryMetadata.fps}
        width={galleryMetadata.width}
        height={galleryMetadata.height}
        defaultProps={{ theme: templateGalleryVideo.defaultTheme }}
        schema={videoInputSchema}
        calculateMetadata={createVideoCalculateMetadata(templateGalleryVideo)}
      />
    </>
  );
};
