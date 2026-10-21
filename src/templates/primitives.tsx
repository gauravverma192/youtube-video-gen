import type { FC, ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { containsFrame } from "../engine";
import type { CaptionCue, ConsoleCue } from "../engine";
import { safeAreaInsets, sceneChrome } from "../layout/safe-area";
import { typeScale } from "../theme/tokens";
import { useTheme } from "./theme-context";

type FramedScene = {
  captions: readonly CaptionCue[];
  console: readonly ConsoleCue[];
};

export const SceneFrame: FC<{ scene: FramedScene; children: ReactNode }> = ({
  scene,
  children,
}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const caption =
    scene.captions.find((cue) => containsFrame(cue, frame)) ?? null;
  const consoleCue =
    scene.console.find((cue) => containsFrame(cue, frame)) ?? null;
  const reserveCaption = scene.captions.length > 0;
  const reserveConsole = scene.console.length > 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.background,
        color: theme.foreground,
        fontFamily: theme.fontSans,
        fontWeight: 400,
        fontSynthesis: "none",
        overflowWrap: "break-word",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: safeAreaInsets.left,
          right: safeAreaInsets.right,
          top: safeAreaInsets.top,
          bottom: safeAreaInsets.bottom,
          display: "flex",
          flexDirection: "column",
          gap: sceneChrome.gap,
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </div>
        {reserveConsole ? (
          <div style={{ height: sceneChrome.consoleSlot, minWidth: 0 }}>
            {consoleCue ? <ConsoleReadout values={consoleCue.values} /> : null}
          </div>
        ) : null}
        {reserveCaption ? (
          <div
            style={{
              height: sceneChrome.captionSlot,
              minWidth: 0,
              display: "flex",
              alignItems: "flex-end",
              overflow: "hidden",
            }}
          >
            {caption ? <Caption text={caption.text} /> : null}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const ConsoleReadout: FC<{ values: readonly string[] }> = ({ values }) => {
  const theme = useTheme();
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 16,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: typeScale.caption,
          fontWeight: 600,
          lineHeight: 1.2,
          color: theme.muted,
          flexShrink: 0,
        }}
      >
        Console
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, minWidth: 0 }}>
        {values.map((value, index) => (
          <div
            key={`${value}-${String(index)}`}
            style={{
              fontFamily: theme.fontMono,
              fontSize: typeScale.body,
              fontWeight: 600,
              lineHeight: 1.2,
              color: theme.consoleForeground,
              backgroundColor: theme.consoleBackground,
              borderRadius: 14,
              padding: "8px 18px",
              boxSizing: "border-box",
            }}
          >
            {value}
          </div>
        ))}
      </div>
    </div>
  );
};

const Caption: FC<{ text: string }> = ({ text }) => {
  const theme = useTheme();
  return (
    <div
      style={{
        maxWidth: "100%",
        boxSizing: "border-box",
        backgroundColor: theme.captionBackground,
        color: theme.captionForeground,
        fontSize: typeScale.caption,
        fontWeight: 600,
        lineHeight: 1.3,
        borderRadius: 18,
        padding: "16px 24px",
      }}
    >
      {text}
    </div>
  );
};

export const RightArrow: FC<{ color: string }> = ({ color }) => {
  return (
    <svg width={44} height={44} viewBox="0 0 44 44" aria-hidden>
      <path
        d="M6 22h24"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path
        d="M22 10l12 12-12 12"
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
