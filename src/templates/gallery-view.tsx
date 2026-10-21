import type { FC } from "react";
import type { VideoInputProps } from "../engine";
import { templateGalleryVideo } from "./gallery";
import { Video } from "./video";

export const TemplateGallery: FC<VideoInputProps> = ({ theme }) => {
  return <Video video={templateGalleryVideo} theme={theme} />;
};
