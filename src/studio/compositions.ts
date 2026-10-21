import type { CalculateMetadataFunction } from "remotion";
import {
  createVideoCalculateMetadata,
  resolveVideoMetadata,
} from "../engine";
import type {
  VideoDefinition,
  VideoInputProps,
  VideoMetadata,
} from "../engine";
import { listVideos } from "../videos";

export type StudioCompositionSource = {
  id: string;
  video: VideoDefinition;
  metadata: VideoMetadata;
  calculateMetadata: CalculateMetadataFunction<VideoInputProps>;
};

/** One Studio composition per registry video. Theme stays in input props. */
export function studioCompositionSources(): StudioCompositionSource[] {
  return listVideos().map((video) => ({
    id: video.id,
    video,
    metadata: resolveVideoMetadata(video),
    calculateMetadata: createVideoCalculateMetadata(video),
  }));
}
