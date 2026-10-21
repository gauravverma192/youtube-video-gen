import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type RefObject,
} from "react";
import { Player, type PlayerRef } from "@remotion/player";
import {
  buildPreviewProps,
  buildTimeline,
  collectVideoIssues,
  formatValidationIssue,
  sceneAtFrame,
} from "../engine";
import type { ThemeId, VideoDefinition } from "../engine";
import { safeAreaInsets } from "../layout/safe-area";
import { bindVideo } from "../templates/bound-video";
import { getVideo, listVideos } from "../videos";

const themes: readonly ThemeId[] = ["dark", "light"];

export const App: FC = () => {
  const videos = listVideos();
  const [videoId, setVideoId] = useState(videos[0]?.id ?? "");
  const [chromeTheme, setChromeTheme] = useState<ThemeId>("dark");
  const [videoTheme, setVideoTheme] = useState<ThemeId>("dark");
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [frame, setFrame] = useState(0);
  const playerRef = useRef<PlayerRef>(null);
  const video = getVideo(videoId);

  useEffect(() => {
    document.documentElement.dataset.chrome = chromeTheme;
  }, [chromeTheme]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    const onFrame = (event: { detail: { frame: number } }) => {
      setFrame(event.detail.frame);
    };
    player.addEventListener("frameupdate", onFrame);
    setFrame(player.getCurrentFrame());
    return () => {
      player.removeEventListener("frameupdate", onFrame);
    };
  }, [videoId]);

  if (!video) {
    return (
      <main className="app">
        <p className="empty">No videos are registered.</p>
      </main>
    );
  }

  return (
    <Preview
      video={video}
      videos={videos}
      chromeTheme={chromeTheme}
      videoTheme={videoTheme}
      showSafeArea={showSafeArea}
      frame={frame}
      playerRef={playerRef}
      onVideoId={(id) => {
        setVideoId(id);
        setFrame(0);
      }}
      onChromeTheme={setChromeTheme}
      onVideoTheme={setVideoTheme}
      onToggleSafeArea={() => {
        setShowSafeArea((current) => !current);
      }}
      onSeek={(next) => {
        playerRef.current?.seekTo(next);
        setFrame(next);
      }}
    />
  );
};

const Preview: FC<{
  video: VideoDefinition;
  videos: readonly VideoDefinition[];
  chromeTheme: ThemeId;
  videoTheme: ThemeId;
  showSafeArea: boolean;
  frame: number;
  playerRef: RefObject<PlayerRef | null>;
  onVideoId: (id: string) => void;
  onChromeTheme: (theme: ThemeId) => void;
  onVideoTheme: (theme: ThemeId) => void;
  onToggleSafeArea: () => void;
  onSeek: (frame: number) => void;
}> = ({
  video,
  videos,
  chromeTheme,
  videoTheme,
  showSafeArea,
  frame,
  playerRef,
  onVideoId,
  onChromeTheme,
  onVideoTheme,
  onToggleSafeArea,
  onSeek,
}) => {
  const preview = buildPreviewProps(video, videoTheme);
  const timeline = buildTimeline(video.scenes);
  const issues = collectVideoIssues(video);
  const active = sceneAtFrame(timeline, frame);
  const component = useMemo(() => bindVideo(video), [video]);
  const seconds = preview.durationInFrames / preview.fps;

  useEffect(() => {
    document.title = `${video.title} · Shorts preview`;
  }, [video.title]);

  return (
    <div className="app">
      <header className="toolbar">
        <div className="title-block">
          <p className="eyebrow">Shorts preview</p>
          <h1>{video.title}</h1>
        </div>
        <label className="field">
          <span>Video</span>
          <select
            id="video"
            value={video.id}
            onChange={(event) => {
              onVideoId(event.target.value);
            }}
          >
            {videos.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.title}
              </option>
            ))}
          </select>
        </label>
        <ThemeSwitch
          legend="Workspace theme"
          value={chromeTheme}
          onChange={onChromeTheme}
        />
        <ThemeSwitch
          legend="Video theme"
          value={videoTheme}
          onChange={onVideoTheme}
        />
        <button
          type="button"
          className="toggle"
          aria-pressed={showSafeArea}
          onClick={onToggleSafeArea}
        >
          Safe area
        </button>
      </header>
      <div className="workspace">
        <div className="stage">
          <div className="frame-slot">
            <div
              className="frame"
              style={{
                ["--frame-w" as string]: String(preview.compositionWidth),
                ["--frame-h" as string]: String(preview.compositionHeight),
                ["--frame-ratio" as string]: String(
                  preview.compositionWidth / preview.compositionHeight,
                ),
              }}
            >
              <div className="player-slot">
              <Player
                key={video.id}
                ref={playerRef}
                component={component}
                inputProps={preview.inputProps}
                durationInFrames={preview.durationInFrames}
                compositionWidth={preview.compositionWidth}
                compositionHeight={preview.compositionHeight}
                fps={preview.fps}
                controls
                clickToPlay
                spaceKeyToPlayOrPause
                acknowledgeRemotionLicense
                style={{ width: "100%", height: "100%" }}
                errorFallback={({ error }) => (
                  <div className="player-error" role="alert">
                    {error.message}
                  </div>
                )}
              />
              </div>
              {showSafeArea ? (
                <div
                  className="safe-area"
                  aria-hidden="true"
                  style={{
                    left: `${(safeAreaInsets.left / preview.compositionWidth) * 100}%`,
                    right: `${(safeAreaInsets.right / preview.compositionWidth) * 100}%`,
                    top: `${(safeAreaInsets.top / preview.compositionHeight) * 100}%`,
                    bottom: `${(safeAreaInsets.bottom / preview.compositionHeight) * 100}%`,
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
        <aside className="sidebar">
          <p className="description">{video.description}</p>
          <dl className="facts">
            <div>
              <dt>Size</dt>
              <dd>
                {preview.compositionWidth}×{preview.compositionHeight}
              </dd>
            </div>
            <div>
              <dt>Frame rate</dt>
              <dd>{preview.fps} fps</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>
                {preview.durationInFrames} frames ({formatSeconds(seconds)})
              </dd>
            </div>
            <div>
              <dt>Playhead</dt>
              <dd>
                frame {frame} ({formatClock(frame, preview.fps)})
              </dd>
            </div>
            <div>
              <dt>Video default</dt>
              <dd>{video.defaultTheme}</dd>
            </div>
          </dl>
          <section
            className="panel"
            aria-label="Validation"
          >
            <h2>Validation{issues.length > 0 ? ` (${String(issues.length)})` : ""}</h2>
            {issues.length === 0 ? (
              <p className="ok">No validation errors.</p>
            ) : (
              <ul className="issues">
                {issues.map((issue) => (
                  <li key={`${issue.sceneId ?? ""}-${issue.field}-${issue.message}`}>
                    {formatValidationIssue(issue)}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <nav className="panel" aria-label="Scenes">
            <h2>Scenes</h2>
            <ol className="scenes">
              {timeline.scenes.map((entry) => {
                const scene = video.scenes[entry.index];
                if (!scene) {
                  return null;
                }
                const current = active?.id === entry.id;
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      aria-current={current ? "true" : undefined}
                      onClick={() => {
                        onSeek(entry.startFrame);
                      }}
                    >
                      <span className="scene-id">{scene.id}</span>
                      <span className="scene-meta">
                        {scene.type} · {entry.durationInFrames} frames · at{" "}
                        {entry.startFrame}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
          <p className="hint">
            The safe-area rectangle is preview-only. Exports use the same
            insets as padding and do not draw the guide.
          </p>
        </aside>
      </div>
    </div>
  );
};

const ThemeSwitch: FC<{
  legend: string;
  value: ThemeId;
  onChange: (theme: ThemeId) => void;
}> = ({ legend, value, onChange }) => {
  return (
    <fieldset className="themes">
      <legend>{legend}</legend>
      <div className="theme-options">
        {themes.map((theme) => (
          <button
            key={theme}
            type="button"
            aria-label={`${legend}: ${theme}`}
            aria-pressed={value === theme}
            onClick={() => {
              onChange(theme);
            }}
          >
            {theme}
          </button>
        ))}
      </div>
    </fieldset>
  );
};

function formatSeconds(seconds: number): string {
  const rounded = Math.round(seconds * 10) / 10;
  return `${String(rounded)}s`;
}

function formatClock(frame: number, fps: number): string {
  const totalCentiseconds = Math.round((frame / fps) * 100);
  const minutes = Math.floor(totalCentiseconds / 6000);
  const seconds = Math.floor(totalCentiseconds / 100) % 60;
  const centiseconds = totalCentiseconds % 100;
  return `${String(minutes)}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}
