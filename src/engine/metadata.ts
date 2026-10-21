import type { CalculateMetadataFunction } from "remotion";
import type { ThemeId, VideoDefinition } from "./schema";
import { buildTimeline } from "./timeline";

export type VideoMetadata = {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
};

export type VideoInputProps = {
  theme: ThemeId;
};

export type PreviewPlayerProps = {
  durationInFrames: number;
  fps: number;
  compositionWidth: number;
  compositionHeight: number;
  inputProps: VideoInputProps;
};

/** Duration, size, and fps shared by calculateMetadata and the preview Player. */
export function resolveVideoMetadata(video: VideoDefinition): VideoMetadata {
  return {
    width: video.width,
    height: video.height,
    fps: video.fps,
    durationInFrames: buildTimeline(video.scenes).durationInFrames,
  };
}

export function buildPreviewProps(
  video: VideoDefinition,
  theme: ThemeId = video.defaultTheme,
): PreviewPlayerProps {
  const metadata = resolveVideoMetadata(video);
  return {
    durationInFrames: metadata.durationInFrames,
    fps: metadata.fps,
    compositionWidth: metadata.width,
    compositionHeight: metadata.height,
    inputProps: { theme },
  };
}

export function calculateVideoMetadata(
  video: VideoDefinition,
  props: VideoInputProps,
): {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  props: VideoInputProps;
} {
  const metadata = resolveVideoMetadata(video);
  return {
    width: metadata.width,
    height: metadata.height,
    fps: metadata.fps,
    durationInFrames: metadata.durationInFrames,
    props,
  };
}

export function createVideoCalculateMetadata(
  video: VideoDefinition,
): CalculateMetadataFunction<VideoInputProps> {
  return ({ props }) => calculateVideoMetadata(video, props);
}
