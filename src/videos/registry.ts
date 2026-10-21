import type { VideoDefinition } from "../engine";
import { eventLoopVideo } from "./event-loop";
import { starterVideo } from "./starter";

/** Preview order. A new Short is one more entry in this list. */
export const videos = [eventLoopVideo, starterVideo] as const;

const seenIds = new Set<string>();
for (const video of videos) {
  if (seenIds.has(video.id)) {
    throw new Error(`Duplicate video id "${video.id}"`);
  }
  seenIds.add(video.id);
}

export function listVideos(): readonly VideoDefinition[] {
  return videos;
}

export function getVideo(id: string): VideoDefinition | undefined {
  return videos.find((video) => video.id === id);
}

export function requireVideo(id: string): VideoDefinition {
  const video = getVideo(id);
  if (!video) {
    const known = videos.map((entry) => entry.id).join(", ");
    throw new Error(`Unknown video "${id}". Known videos: ${known}`);
  }
  return video;
}
