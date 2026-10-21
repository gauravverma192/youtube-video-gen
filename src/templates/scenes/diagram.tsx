import type { FC } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { containsFrame, resolveDiagramState } from "../../engine";
import type { DiagramScene } from "../../engine";
import { diagramCanvasSize, sceneChrome } from "../../layout/safe-area";
import { lineHeight, typeScale } from "../../theme/tokens";
import {
  arrowParts,
  connectorSegment,
  diagramMetrics,
  nodeBoxes,
} from "../diagram-layout";
import type { SceneTemplateProps } from "../registry-types";
import { SceneFrame } from "../primitives";
import { useTheme } from "../theme-context";

const HEAD_LENGTH = 28;

function emphasisStart(
  scene: DiagramScene,
  frame: number,
  id: string,
): number | null {
  for (const beat of scene.emphasis) {
    if (containsFrame(beat, frame) && beat.targets.includes(id)) {
      return beat.startFrame;
    }
  }
  return null;
}

export const DiagramSceneView: FC<SceneTemplateProps<DiagramScene>> = ({
  scene,
}) => {
  const rawFrame = useCurrentFrame();
  const frame = Math.min(
    scene.durationInFrames - 1,
    Math.max(0, rawFrame),
  );
  const { width, height } = useVideoConfig();
  const theme = useTheme();
  const resolved = resolveDiagramState(scene, frame);
  const canvas = diagramCanvasSize({
    frameWidth: width,
    frameHeight: height,
    title: scene.title !== undefined,
    caption: scene.captions.length > 0,
    console: scene.console.length > 0,
  });
  const capacity = new Map(
    scene.nodes.map((node) => [node.id, node.items.length]),
  );
  const boxes = nodeBoxes(
    resolved.nodes.map((node) => ({
      id: node.id,
      x: node.x,
      y: node.y,
      itemCount: capacity.get(node.id) ?? node.items.length,
    })),
    canvas,
  );
  const boxById = new Map(boxes.map((box) => [box.id, box]));

  return (
    <SceneFrame scene={scene}>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: sceneChrome.gap,
        }}
      >
        {scene.title ? (
          <div
            style={{
              height: sceneChrome.titleSlot,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                fontSize: typeScale.heading,
                fontWeight: 700,
                lineHeight: lineHeight.tight,
                color: theme.foreground,
              }}
            >
              {scene.title}
            </div>
          </div>
        ) : null}
        <div
          style={{
            position: "relative",
            width: canvas.width,
            height: canvas.height,
          }}
        >
          <svg
            width={canvas.width}
            height={canvas.height}
            viewBox={`0 0 ${String(canvas.width)} ${String(canvas.height)}`}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              overflow: "visible",
            }}
          >
            {resolved.connectors.map((connector) => {
              const from = boxById.get(connector.from);
              const to = boxById.get(connector.to);
              if (!from || !to) {
                return null;
              }
              const arrow = arrowParts(
                connectorSegment(from, to),
                HEAD_LENGTH,
              );
              const color = connector.emphasized
                ? theme.accent
                : theme.connector;
              return (
                <g key={connector.id}>
                  <line
                    x1={arrow.x1}
                    y1={arrow.y1}
                    x2={arrow.x2}
                    y2={arrow.y2}
                    stroke={color}
                    strokeWidth={connector.emphasized ? 8 : 6}
                    strokeLinecap="butt"
                  />
                  <polygon points={arrow.head} fill={color} />
                </g>
              );
            })}
          </svg>
          {resolved.connectors.map((connector) => {
            if (!connector.label) {
              return null;
            }
            const from = boxById.get(connector.from);
            const to = boxById.get(connector.to);
            if (!from || !to) {
              return null;
            }
            const segment = connectorSegment(from, to);
            return (
              <div
                key={`${connector.id}-label`}
                style={{
                  position: "absolute",
                  left: (segment.x1 + segment.x2) / 2,
                  top: (segment.y1 + segment.y2) / 2,
                  translate: "-50% -50%",
                  zIndex: 1,
                  maxWidth: 240,
                  boxSizing: "border-box",
                  textAlign: "center",
                  backgroundColor: theme.surface,
                  color: theme.foreground,
                  border: `2px solid ${theme.surfaceBorder}`,
                  borderRadius: 12,
                  padding: "8px 14px",
                  fontSize: typeScale.caption,
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                {connector.label}
              </div>
            );
          })}
          {resolved.nodes.map((node) => {
            const box = boxById.get(node.id);
            if (!box) {
              return null;
            }
            const start = emphasisStart(scene, frame, node.id);
            return (
              <div
                key={node.id}
                style={{
                  position: "absolute",
                  left: box.x - box.width / 2,
                  top: box.y - box.height / 2,
                  width: box.width,
                  height: box.height,
                  zIndex: 2,
                  boxSizing: "border-box",
                  padding: `${String(diagramMetrics.paddingY)}px ${String(diagramMetrics.paddingX)}px`,
                  borderRadius: 28,
                  backgroundColor: theme.surface,
                  border: `3px solid ${node.emphasized ? theme.accent : theme.surfaceBorder}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: diagramMetrics.headerGap,
                  scale:
                    start === null
                      ? 1
                      : interpolate(frame, [start, start + 8], [0.98, 1], {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                          easing: Easing.bezier(0.16, 1, 0.3, 1),
                          output: "perceptual-scale",
                        }),
                }}
              >
                <div
                  style={{
                    fontSize: diagramMetrics.labelSize,
                    lineHeight: diagramMetrics.labelLine,
                    fontWeight: 700,
                    color: theme.foreground,
                  }}
                >
                  {node.label}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: diagramMetrics.itemGap,
                  }}
                >
                  {node.items.length === 0 ? (
                    <div
                      style={{
                        minHeight: diagramMetrics.itemRow,
                        boxSizing: "border-box",
                        borderRadius: 14,
                        border: `2px dashed ${theme.surfaceBorder}`,
                      }}
                    />
                  ) : (
                    node.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          minHeight: diagramMetrics.itemRow,
                          boxSizing: "border-box",
                          borderRadius: 14,
                          padding: "12px 16px",
                          display: "flex",
                          alignItems: "center",
                          backgroundColor: item.emphasized
                            ? theme.accent
                            : theme.background,
                          color: item.emphasized
                            ? theme.accentForeground
                            : theme.foreground,
                          fontSize: typeScale.body,
                          fontWeight: 700,
                          lineHeight: 1.2,
                        }}
                      >
                        {item.label}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SceneFrame>
  );
};
