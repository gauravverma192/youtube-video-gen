import type { FC } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { HookScene } from "../../engine";
import { lineHeight, typeScale } from "../../theme/tokens";
import type { SceneTemplateProps } from "../registry-types";
import { SceneFrame } from "../primitives";
import { useTheme } from "../theme-context";

export const HookSceneView: FC<SceneTemplateProps<HookScene>> = ({
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
          gap: 28,
        }}
      >
        {scene.kicker ? (
          <div
            style={{
              fontSize: typeScale.kicker,
              fontWeight: 600,
              letterSpacing: "0.04em",
              lineHeight: lineHeight.body,
              textTransform: "uppercase",
              color: theme.foreground,
            }}
          >
            {scene.kicker}
          </div>
        ) : null}
        <div
          style={{
            width: 96,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.accent,
          }}
        />
        <div
          style={{
            fontSize: typeScale.title,
            fontWeight: 700,
            lineHeight: lineHeight.tight,
            letterSpacing: "-0.03em",
            color: theme.foreground,
            translate: interpolate(frame, [0, 12], ["0px 16px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          {scene.title}
        </div>
      </div>
    </SceneFrame>
  );
};
