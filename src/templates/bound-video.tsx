import type { FC } from "react";
import type { VideoDefinition, VideoInputProps } from "../engine";
import { Video } from "./video";

/**
 * One component for every registry composition and the preview Player.
 * The video definition is closed over. Theme is the only input prop.
 */
export function bindVideo(video: VideoDefinition): FC<VideoInputProps> {
  const BoundVideo: FC<VideoInputProps> = ({ theme }) => {
    return <Video video={video} theme={theme} />;
  };
  BoundVideo.displayName = video.id;
  return BoundVideo;
}
