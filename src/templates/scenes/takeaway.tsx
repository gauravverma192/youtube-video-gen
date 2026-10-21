import { Fragment, type FC } from "react";
import type { TakeawayScene } from "../../engine";
import { lineHeight, typeScale } from "../../theme/tokens";
import type { SceneTemplateProps } from "../registry-types";
import { RightArrow, SceneFrame } from "../primitives";
import { useTheme } from "../theme-context";

export const TakeawaySceneView: FC<SceneTemplateProps<TakeawayScene>> = ({
  scene,
}) => {
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
          gap: 36,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            width: "100%",
          }}
        >
          {scene.sequence.map((token, index) => (
            <Fragment key={`${String(index)}-${token}`}>
              {index > 0 ? <RightArrow color={theme.accent} /> : null}
              <div
                style={{
                  fontSize: typeScale.token,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: theme.foreground,
                  backgroundColor: theme.surface,
                  border: `3px solid ${theme.surfaceBorder}`,
                  borderRadius: 20,
                  padding: "12px 22px",
                  boxSizing: "border-box",
                }}
              >
                {token}
              </div>
            </Fragment>
          ))}
        </div>
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
          {scene.sentence}
        </div>
      </div>
    </SceneFrame>
  );
};
