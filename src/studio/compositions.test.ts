import { describe, expect, it } from "vitest";
import { resolveVideoMetadata } from "../engine";
import { listVideos } from "../videos";
import { studioCompositionSources } from "./compositions";

describe("studio compositions", () => {
  it("registers one composition per video and reuses the metadata helper", () => {
    const sources = studioCompositionSources();
    expect(sources.map((source) => source.id)).toEqual(
      listVideos().map((video) => video.id),
    );

    for (const source of sources) {
      expect(source.metadata).toEqual(resolveVideoMetadata(source.video));
      expect(
        source.calculateMetadata({
          props: { theme: "light" },
          defaultProps: { theme: source.video.defaultTheme },
          abortSignal: new AbortController().signal,
          compositionId: source.id,
          isRendering: false,
        }),
      ).toEqual({
        ...source.metadata,
        props: { theme: "light" },
      });
    }
  });
});
