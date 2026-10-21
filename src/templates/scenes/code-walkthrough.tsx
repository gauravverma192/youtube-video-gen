import type { FC } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { intervalsAtFrame } from "../../engine";
import type { CodeWalkthroughScene } from "../../engine";
import { lineHeight, typeScale } from "../../theme/tokens";
import type { SceneTemplateProps } from "../registry-types";
import { SceneFrame } from "../primitives";
import { useTheme } from "../theme-context";

export const CodeWalkthroughSceneView: FC<
  SceneTemplateProps<CodeWalkthroughScene>
> = ({ scene }) => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const lines = scene.code.split("\n");
  const active = intervalsAtFrame(scene.highlights, frame);
  const highlighted = new Set(active.flatMap((beat) => beat.lines));
  const notes = active.filter((beat) => beat.note !== undefined);

  return (
    <SceneFrame scene={scene}>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {scene.question ? (
          <div
            style={{
              fontSize: typeScale.body,
              fontWeight: 600,
              lineHeight: lineHeight.body,
              color: theme.foreground,
            }}
          >
            {scene.question}
          </div>
        ) : null}
        {scene.language ? (
          <div
            style={{
              fontSize: typeScale.kicker,
              fontWeight: 600,
              lineHeight: lineHeight.body,
              color: theme.muted,
            }}
          >
            {scene.language}
          </div>
        ) : null}
        <div
          style={{
            boxSizing: "border-box",
            backgroundColor: theme.codeBackground,
            border: `2px solid ${theme.surfaceBorder}`,
            borderRadius: 24,
            padding: "16px 12px",
          }}
        >
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            const beat = active.find((candidate) =>
              candidate.lines.includes(lineNumber),
            );
            const isOn = highlighted.has(lineNumber);
            return (
              <div
                key={lineNumber}
                style={{
                  position: "relative",
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                  padding: "6px 12px 6px 20px",
                  borderRadius: 12,
                  backgroundColor: isOn ? theme.highlight : "transparent",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 8,
                    bottom: 8,
                    width: 8,
                    borderRadius: 4,
                    backgroundColor: theme.highlightBar,
                    opacity: beat
                      ? interpolate(
                          frame,
                          [beat.startFrame, beat.startFrame + 6],
                          [0, 1],
                          {
                            extrapolateLeft: "clamp",
                            extrapolateRight: "clamp",
                          },
                        )
                      : 0,
                  }}
                />
                <div
                  style={{
                    width: 48,
                    flexShrink: 0,
                    fontFamily: theme.fontMono,
                    fontSize: typeScale.lineNumber,
                    lineHeight: lineHeight.code,
                    fontWeight: 400,
                    color: theme.muted,
                    textAlign: "right",
                  }}
                >
                  {lineNumber}
                </div>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontFamily: theme.fontMono,
                    fontSize: typeScale.code,
                    lineHeight: lineHeight.code,
                    fontWeight: isOn ? 600 : 400,
                    color: theme.codeForeground,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {line.length > 0 ? line : " "}
                </div>
              </div>
            );
          })}
        </div>
        {notes.map((beat) => (
          <div
            key={beat.id}
            style={{
              boxSizing: "border-box",
              backgroundColor: theme.surface,
              borderLeft: `8px solid ${theme.accent}`,
              borderRadius: 16,
              padding: "16px 20px",
              fontSize: typeScale.body,
              fontWeight: 600,
              lineHeight: lineHeight.body,
              color: theme.foreground,
            }}
          >
            {beat.note}
          </div>
        ))}
      </div>
    </SceneFrame>
  );
};
