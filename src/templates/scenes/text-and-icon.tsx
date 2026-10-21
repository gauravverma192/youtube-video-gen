import type { FC } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { TextAndIconScene } from "../../engine";
import { lineHeight, typeScale } from "../../theme/tokens";
import type { SceneTemplateProps } from "../registry-types";
import { SceneFrame } from "../primitives";
import { useTheme } from "../theme-context";

function iconSize(icon: string): number {
  if (icon.length <= 2) {
    return typeScale.icon;
  }
  if (icon.length <= 8) {
    return typeScale.heading;
  }
  return typeScale.body;
}

export const TextAndIconSceneView: FC<SceneTemplateProps<TextAndIconScene>> = ({
  scene,
}) => {
  const frame = useCurrentFrame();
  const theme = useTheme();

  return (
    <SceneFrame scene={scene}>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "stretch",
          gap: 32,
        }}
      >
        <div
          style={{
            alignSelf: "center",
            width: 220,
            height: 220,
            boxSizing: "border-box",
            borderRadius: 48,
            backgroundColor: theme.surface,
            border: `3px solid ${theme.accent}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            textAlign: "center",
            overflowWrap: "break-word",
            fontSize: iconSize(scene.icon),
            fontWeight: 700,
            lineHeight: 1.05,
            color: theme.accent,
            scale: interpolate(frame, [0, 10], [0.92, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              output: "perceptual-scale",
            }),
          }}
        >
          {scene.icon}
        </div>
        <div
          style={{
            width: "100%",
            textAlign: "center",
            fontSize: typeScale.token,
            fontWeight: 700,
            lineHeight: lineHeight.tight,
            color: theme.foreground,
          }}
        >
          {scene.title}
        </div>
        {scene.body ? (
          <div
            style={{
              width: "100%",
              textAlign: "center",
              fontSize: typeScale.body,
              fontWeight: 600,
              lineHeight: lineHeight.body,
              color: theme.foreground,
            }}
          >
            {scene.body}
          </div>
        ) : null}
      </div>
    </SceneFrame>
  );
};
